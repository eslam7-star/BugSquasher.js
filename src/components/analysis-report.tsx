'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileCode,
  AlertTriangle,
  KeyRound,
  Link,
  ShieldCheck,
  FileTerminal,
  ServerCrash,
} from 'lucide-react';
import type { DomainAnalysisResult } from '@/app/actions';
import { Badge } from '@/components/ui/badge';

type AnalysisReportProps = {
  results: DomainAnalysisResult[] | null;
  isLoading: boolean;
};

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-code-editor-foreground/10 text-code-editor-foreground p-3 rounded-md overflow-x-auto text-sm">
      <code>{code}</code>
    </pre>
  );
}

function ReportPlaceholder() {
  return (
    <div className="text-center text-muted-foreground py-16 rounded-lg border border-dashed">
      <FileTerminal className="mx-auto h-12 w-12" />
      <h3 className="mt-4 text-lg font-medium">Analysis Report</h3>
      <p className="mt-1 text-sm">
        Scan a domain to see the analysis report here.
      </p>
    </div>
  );
}

function LoadingSkeletons() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}

function AnalysisSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
        {icon}
        {title}
      </h4>
      <div className="pl-6 space-y-3">{children}</div>
    </div>
  );
}

export function AnalysisReport({
  results,
  isLoading,
}: AnalysisReportProps) {
  if (isLoading) {
    return <LoadingSkeletons />;
  }
  if (!results) {
    return <ReportPlaceholder />;
  }
  if (results.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-16 rounded-lg border border-dashed">
        <ShieldCheck className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-4 text-lg font-medium">
          No JavaScript files found to analyze.
        </h3>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <FileCode className="w-6 h-6 text-primary" />
          Scanned Files
        </CardTitle>
        <CardDescription>
          Found {results.length} JavaScript file
          {results.length === 1 ? '' : 's'}. Click to see details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full space-y-2">
          {results.map(({ fileUrl, analysis, error }, index) => (
            <AccordionItem
              value={`item-${index}`}
              key={index}
              className="border-b-0"
            >
              <AccordionTrigger className="text-left hover:no-underline border rounded-md px-4 data-[state=open]:rounded-b-none data-[state=open]:border-b-0">
                <div className="flex items-center gap-3 truncate w-full">
                  {error ? (
                    <ServerCrash className="h-5 w-5 text-destructive" />
                  ) : (
                    <FileCode className="h-5 w-5 text-muted-foreground" />
                  )}
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-sm underline hover:text-primary"
                    onClick={e => e.stopPropagation()}
                  >
                    {fileUrl.replace(/https?:\/\//, '')}
                  </a>
                  {analysis && (
                    <div className="flex gap-2 ml-auto items-center pr-4">
                      {analysis.vulnerabilities.length > 0 && (
                        <Badge variant="destructive">
                          {analysis.vulnerabilities.length} vuln
                          {analysis.vulnerabilities.length > 1 && 's'}
                        </Badge>
                      )}
                      {analysis.secrets.length > 0 && (
                        <Badge variant="secondary">
                          {analysis.secrets.length} secret
                          {analysis.secrets.length > 1 && 's'}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 border border-t-0 rounded-b-md">
                {error && (
                  <p className="text-destructive">
                    Could not analyze file: {error}
                  </p>
                )}
                {analysis && (
                  <>
                    {!analysis.vulnerabilities.length &&
                      !analysis.secrets.length &&
                      !analysis.endpoints.length && (
                        <div className="text-center text-green-500 py-8">
                          <ShieldCheck className="mx-auto h-10 w-10" />
                          <p className="mt-2 font-medium">
                            No issues found in this file.
                          </p>
                        </div>
                      )}
                    {analysis.vulnerabilities.length > 0 && (
                      <AnalysisSection
                        title="Vulnerabilities"
                        icon={<AlertTriangle className="text-destructive" />}
                      >
                        {analysis.vulnerabilities.map((vuln, i) => (
                          <div key={i} className="bg-muted/50 p-3 rounded-md">
                            <h5 className="font-semibold">{vuln.title}</h5>
                            <p className="text-muted-foreground text-sm my-1">
                              {vuln.description}
                            </p>
                            <CodeBlock code={vuln.snippet} />
                          </div>
                        ))}
                      </AnalysisSection>
                    )}
                    {analysis.secrets.length > 0 && (
                      <AnalysisSection
                        title="Potential Secrets"
                        icon={<KeyRound className="text-yellow-500" />}
                      >
                        {analysis.secrets.map((secret, i) => (
                          <div key={i} className="bg-muted/50 p-3 rounded-md">
                            <h5 className="font-semibold">{secret.type}</h5>
                            <CodeBlock code={secret.snippet} />
                          </div>
                        ))}
                      </AnalysisSection>
                    )}
                    {analysis.endpoints.length > 0 && (
                      <AnalysisSection
                        title="Discovered Endpoints & URLs"
                        icon={<Link className="text-blue-500" />}
                      >
                        <div className="flex flex-col gap-1">
                          {analysis.endpoints.map((endpoint, i) => (
                            <a
                              key={i}
                              href={endpoint}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground text-sm truncate font-mono bg-muted/50 p-2 rounded-md hover:bg-muted hover:text-foreground"
                            >
                              {endpoint}
                            </a>
                          ))}
                        </div>
                      </AnalysisSection>
                    )}
                  </>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
