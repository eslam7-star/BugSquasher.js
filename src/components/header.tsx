import { ShieldCheck } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="py-4 border-b sticky top-0 bg-background/95 backdrop-blur z-10">
      <div className="container mx-auto flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <ShieldCheck className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-xl font-bold font-headline tracking-tight">
          JS Guard
        </h1>
      </div>
    </header>
  );
}
