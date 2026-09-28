'use client';

import { Suspense } from 'react';
import { CheckoutContent } from './CheckoutContent';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<main className='flex-1 flex items-center justify-center'><div className='animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full text-cyan-500' /></main>}>
      <CheckoutContent />
    </Suspense>
  );
}