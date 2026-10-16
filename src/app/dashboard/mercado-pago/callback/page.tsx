import { Suspense } from 'react';
import MercadoPagoCallbackContent from './MercadoPagoCallbackContent';

export default function MercadoPagoCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="h-40 bg-slate-800/50 rounded-xl animate-pulse" />
      }
    >
      <MercadoPagoCallbackContent />
    </Suspense>
  );
}
