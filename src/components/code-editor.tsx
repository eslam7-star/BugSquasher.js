import { BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type CodeEditorProps = {
  code: string;
  setCode: (code: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
};

export function CodeEditor({
  code,
  setCode,
  onAnalyze,
  isLoading,
}: CodeEditorProps) {
  return (
    <Card className="flex flex-col h-full sticky top-24">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-primary" />
          Code Input
        </CardTitle>
        <CardDescription>
          Enter a JavaScript snippet below and our AI will analyze it for
          security vulnerabilities.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-4">
        <div className="grid w-full gap-1.5 flex-1">
          <Label htmlFor="code-input" className="sr-only">
            JavaScript Code
          </Label>
          <Textarea
            id="code-input"
            placeholder="Paste your code here..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-code bg-code-editor text-code-editor-foreground h-96 flex-1 resize-y rounded-md focus-visible:ring-accent"
          />
        </div>
        <Button onClick={onAnalyze} disabled={isLoading} size="lg">
          {isLoading ? 'Analyzing...' : 'Analyze Code'}
        </Button>
      </CardContent>
    </Card>
  );
}
