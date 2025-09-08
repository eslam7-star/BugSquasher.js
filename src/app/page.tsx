'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Search } from 'lucide-react';
import type { DomainAnalysisResult } from './actions';
import { analyzeDomain, analyzeUrls } from './actions';
import { AnalysisReport } from '@/components/analysis-report';

type ScanMode = 'domain' | 'manual';

export default function Home() {
  const [domain, setDomain] = useState<string>('genkit.dev');
  const [manualUrls, setManualUrls] = useState<string>('');
  const [scanMode, setScanMode] = useState<ScanMode>('domain');
  const [analysisResults, setAnalysisResults] = useState<
    DomainAnalysisResult[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysisResults(null);
    let result;

    if (scanMode === 'domain') {
      if (!domain.trim()) {
        toast({
          variant: 'destructive',
          title: 'Empty Domain',
          description: 'Please enter a domain to scan.',
        });
        setIsLoading(false);
        return;
      }
      result = await analyzeDomain(domain);
    } else {
      const urls = manualUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);
      if (urls.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Empty URL List',
          description: 'Please enter at least one JavaScript file URL.',
        });
        setIsLoading(false);
        return;
      }
      result = await analyzeUrls(urls);
    }

    if (result.success) {
      if (result.data.length === 0) {
        toast({
          title: 'No Scripts Found',
          description: `Could not find any scannable .js files.`,
        });
      }
      setAnalysisResults(result.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description:
          result.error || 'An unexpected error occurred. Please try again.',
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="container mx-auto max-w-4xl grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">JS Code Scanner</CardTitle>
              <CardDescription>
                Analyze JavaScript files for vulnerabilities and secrets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={scanMode}
                onValueChange={value => setScanMode(value as ScanMode)}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="domain">Domain Scan</TabsTrigger>
                  <TabsTrigger value="manual">Manual URL Input</TabsTrigger>
                </TabsList>
                <TabsContent value="domain" className="mt-4">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="example.com"
                      value={domain}
                      onChange={e => setDomain(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAnalyze();
                      }}
                      disabled={isLoading}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="manual" className="mt-4">
                  <div className="flex flex-col gap-2">
                    <Textarea
                      placeholder="Paste JS file URLs, one per line..."
                      value={manualUrls}
                      onChange={e => setManualUrls(e.target.value)}
                      className="h-32 font-code"
                      disabled={isLoading}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              <Button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="mt-4 w-full"
                size="lg"
              >
                {isLoading ? (
                  'Scanning...'
                ) : (
                  <>
                    <Search className="mr-2" /> Scan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <AnalysisReport results={analysisResults} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}
