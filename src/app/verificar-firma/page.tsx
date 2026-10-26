import { Suspense } from 'react';
import VerificarFirmaContent from './VerificarFirmaContent';

export default function VerificarFirmaPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full text-cyan-500" />
        </main>
      }
    >
      <VerificarFirmaContent />
    </Suspense>
  );
}
