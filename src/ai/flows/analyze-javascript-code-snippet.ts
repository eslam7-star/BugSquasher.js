'use server';
/**
 * @fileOverview Analyzes JavaScript code for security risks.
 *
 * - analyzeJsContent - Analyzes the code for secrets, endpoints, and vulnerabilities.
 * - JsAnalysisInput - Input schema for the analysis.
 * - JsAnalysisOutput - Output schema with identified issues.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const JsAnalysisInputSchema = z.object({
  code: z.string().describe('The JavaScript code to analyze.'),
});
export type JsAnalysisInput = z.infer<typeof JsAnalysisInputSchema>;

const JsAnalysisOutputSchema = z.object({
  secrets: z
    .array(
      z.object({
        type: z
          .string()
          .describe(
            'The type of secret found (e.g., API Key, JWT Token, Password).'
          ),
        snippet: z
          .string()
          .describe('The line of code where the secret was found.'),
      })
    )
    .describe('An array of potential hardcoded secrets discovered in the code.'),
  endpoints: z
    .array(z.string())
    .describe(
      'An array of all API endpoints, URLs, and domains found in the code.'
    ),
  vulnerabilities: z
    .array(
      z.object({
        title: z
          .string()
          .describe(
            "A brief, descriptive title for the vulnerability (e.g., 'Potential Cross-Site Scripting (XSS)')."
          ),
        description: z
          .string()
          .describe('A detailed explanation of the vulnerability, its risks, and how it could be exploited.'),
        snippet: z
          .string()
          .describe('The exact code snippet that contains the vulnerability.'),
      })
    )
    .describe(
      'An array of potential security vulnerabilities or dangerous code patterns identified.'
    ),
});
export type JsAnalysisOutput = z.infer<typeof JsAnalysisOutputSchema>;

export async function analyzeJsContent(
  input: JsAnalysisInput
): Promise<JsAnalysisOutput> {
  const result = await analyzeJsContentFlow(input);
  if (!result) {
    throw new Error('The AI model returned an empty or invalid analysis. This could be due to a content safety filter or an internal error.');
  }
  return result;
}

const prompt = ai.definePrompt({
  name: 'analyzeJsContentPrompt',
  input: {schema: JsAnalysisInputSchema},
  output: {schema: JsAnalysisOutputSchema},
  prompt: `You are an expert application security engineer specializing in advanced JavaScript static analysis. Your task is to perform a deep security scan on the provided JavaScript code, focusing on how user input can lead to client-side attacks.

Your analysis should cover these categories:

1.  **Hardcoded Secrets**: Find any exposed API keys, access tokens, passwords, or other sensitive credentials.

2.  **API Endpoints & URLs**: Extract all URLs, subdomains, and API endpoints to map the application's attack surface.

3.  **Code Vulnerabilities (Deep Analysis)**: Go beyond simple pattern matching. Trace how data, especially from sources like 'location.search', 'document.cookie', 'window.name', or form inputs, is handled. Specifically look for:
    *   **Cross-Site Scripting (XSS)**: Identify where untrusted user input is passed to dangerous sinks like \`innerHTML\`, \`outerHTML\`, \`document.write()\`, or direct HTML element creation without proper sanitization.
    *   **Prototype Pollution**: Look for unsafe recursive merge functions or property assignments (e.g., using square bracket notation \`a[b]\`) that could allow an attacker to modify \`Object.prototype\`.
    *   **Client-Side Injections**: Detect cases where user input is used to construct code for \`eval()\`, \`setTimeout()\`, or to build URLs for API requests, which could lead to injection attacks.
    *   **Open Redirects**: Find instances where user-supplied URLs are used for navigation without validation.

For each vulnerability, provide a clear title, a detailed description of the risk and how it can be exploited, and the exact code snippet. If no issues are found in a category, return an empty array for it.

Code to analyze:
\`\`\`
{{{code}}}
\`\`\`
`,
});

const analyzeJsContentFlow = ai.defineFlow(
  {
    name: 'analyzeJsContentFlow',
    inputSchema: JsAnalysisInputSchema,
    outputSchema: JsAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output;
  }
);
