'use client';

import { Suspense } from 'react';
import { CheckoutExitoContent } from './CheckoutExitoContent';

export default function CheckoutExitoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex flex-col"><div className="flex-1 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full text-cyan-500" /></div></div>}>
      <CheckoutExitoContent />
    </Suspense>
  );
}