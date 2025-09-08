'use server';

import {
  analyzeJsContent,
  type JsAnalysisOutput,
} from '@/ai/flows/analyze-javascript-code-snippet';

const BROWSER_HEADERS = {
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Ch-Ua':
    '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
};

function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

function handleError(error: unknown, defaultMessage: string) {
  if (isErrorWithMessage(error)) {
    if (error.message.includes('403')) {
      return {
        success: false as const,
        error: `Access denied (403). The site's security (WAF) may be blocking scans.`,
      };
    }
    return { success: false as const, error: error.message };
  }
  return { success: false as const, error: defaultMessage };
}

export type DomainAnalysisResult = {
  fileUrl: string;
  analysis: JsAnalysisOutput | null;
  error?: string;
};

// New function to chunk code with overlap
function getCodeChunks(code: string): string[] {
  const CHUNK_SIZE = 500000; // 500k characters
  const OVERLAP = 5000; // 5k characters overlap
  const chunks: string[] = [];
  if (code.length <= CHUNK_SIZE) {
    return [code];
  }

  let i = 0;
  while (i < code.length) {
    const start = i;
    const end = Math.min(i + CHUNK_SIZE, code.length);
    chunks.push(code.substring(start, end));
    i += CHUNK_SIZE - OVERLAP;
    if (i < OVERLAP && code.length > CHUNK_SIZE) {
      i = CHUNK_SIZE - OVERLAP;
    }
  }
  return chunks;
}

// New function to merge analysis results from chunks
function mergeAnalysisResults(results: JsAnalysisOutput[]): JsAnalysisOutput {
  const combined: JsAnalysisOutput = {
    secrets: [],
    endpoints: [],
    vulnerabilities: [],
  };

  const secretSnippets = new Set<string>();
  const endpointUrls = new Set<string>();
  const vulnerabilitySnippets = new Set<string>();

  for (const result of results) {
    for (const secret of result.secrets) {
      if (!secretSnippets.has(secret.snippet)) {
        combined.secrets.push(secret);
        secretSnippets.add(secret.snippet);
      }
    }
    for (const endpoint of result.endpoints) {
      if (!endpointUrls.has(endpoint)) {
        combined.endpoints.push(endpoint);
        endpointUrls.add(endpoint);
      }
    }
    for (const vulnerability of result.vulnerabilities) {
      if (!vulnerabilitySnippets.has(vulnerability.snippet)) {
        combined.vulnerabilities.push(vulnerability);
        vulnerabilitySnippets.add(vulnerability.snippet);
      }
    }
  }
  return combined;
}

async function processUrl(url: string): Promise<DomainAnalysisResult> {
  try {
    const scriptResponse = await fetch(url, { headers: BROWSER_HEADERS });
    if (!scriptResponse.ok) {
      throw new Error(`Failed to fetch script with status ${scriptResponse.status}`);
    }
    const code = await scriptResponse.text();

    if (code.trim() === '') {
      return {
        fileUrl: url,
        analysis: null,
        error: 'File is empty.',
      };
    }
    
    const chunks = getCodeChunks(code);
    const chunkAnalyses: JsAnalysisOutput[] = [];

    for (const chunk of chunks) {
        const analysis = await analyzeJsContent({ code: chunk });
        chunkAnalyses.push(analysis);
    }
    
    const finalAnalysis = mergeAnalysisResults(chunkAnalyses);

    return { fileUrl: url, analysis: finalAnalysis };
  } catch (e) {
    let message = 'An unknown error occurred while processing this script.';
    if (isErrorWithMessage(e)) {
      if (e.message.includes('429') || /rate limit|quota/i.test(e.message)) {
        message =
          'API quota limit reached. Please check your billing account or try again later.';
      } else {
        message = e.message;
      }
    }
    return { fileUrl: url, analysis: null, error: message };
  }
}

export async function analyzeUrls(
  urls: string[]
): Promise<
  { success: true; data: DomainAnalysisResult[] } | { success: false; error: string }
> {
  try {
    const results: DomainAnalysisResult[] = [];
    // Process URLs sequentially to avoid rate limiting
    for (const url of urls) {
      const result = await processUrl(url);
      results.push(result);
    }
    return { success: true, data: results };
  } catch (error) {
    return handleError(error, 'An unknown error occurred during URL analysis.');
  }
}

export async function analyzeDomain(
  domain: string
): Promise<
  { success: true; data: DomainAnalysisResult[] } | { success: false; error: string }
> {
  try {
    if (!domain) {
      return { success: false, error: 'Domain cannot be empty.' };
    }

    let response;
    try {
      response = await fetch(`https://${domain.trim()}`, {
        headers: BROWSER_HEADERS,
      });
    } catch (e) {
      return {
        success: false,
        error: `Could not reach domain: ${domain}. Please check the name and try again.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch domain '${domain}'. Status: ${response.status}`,
      };
    }

    const html = await response.text();
    const jsFileRegex = /(https?:\/\/[^\s'"<>`]+\.js)/gi;
    const scriptUrls = new Set<string>();
    const baseUrl = new URL(response.url);

    // Find all .js files in the entire HTML content
    let match;
    while ((match = jsFileRegex.exec(html)) !== null) {
      try {
        const resolvedUrl = new URL(match[1], baseUrl).href;
        scriptUrls.add(resolvedUrl);
      } catch (e) {
        console.warn(`Skipping invalid script URL: ${match[1]}`);
      }
    }
    
    // Find all src attributes from script tags
    const scriptTagRegex = /<script[^>]*?src\s*=\s*['"]([^'"]+\.js(?:\?[^'"]*)?)['"][^>]*?>/gi;
    while ((match = scriptTagRegex.exec(html)) !== null) {
      try {
        const resolvedUrl = new URL(match[1], baseUrl).href;
        scriptUrls.add(resolvedUrl);
      } catch (e) {
        console.warn(`Skipping invalid script URL: ${match[1]}`);
      }
    }

    const uniqueUrls = Array.from(scriptUrls);

    if (uniqueUrls.length === 0) {
      return { success: true, data: [] };
    }

    const results: DomainAnalysisResult[] = [];
    // Process URLs sequentially to avoid rate limiting
    for (const url of uniqueUrls) {
      const result = await processUrl(url);
      results.push(result);
    }

    return { success: true, data: results };
  } catch (error) {
    return handleError(
      error,
      'An unknown error occurred during domain analysis.'
    );
  }
}
