'use client';

import { Suspense } from 'react';
import Header from '@/components/layout/Header';
import { CheckoutContent } from './CheckoutContent';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex flex-col"><Header /><main className="flex-1 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full text-cyan-500" /></main></div>}>
      <CheckoutContent />
    </Suspense>
  );
}