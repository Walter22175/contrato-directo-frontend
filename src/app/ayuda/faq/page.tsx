'use client';

import { Suspense } from 'react';
import FaqContent from './FaqContent';

export default function FaqPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex flex-col"><div className="bg-slate-900/50 border-b border-slate-800 py-8"><div className="max-w-3xl mx-auto px-4"><div className="flex items-center gap-3 text-sm text-slate-400 mb-4"><a href="/ayuda" className="hover:text-cyan-400 transition-colors">Ayuda</a><span>/</span><span className="text-white">Preguntas Frecuentes</span></div><h1 className="text-3xl font-bold text-white mb-2">Preguntas Frecuentes</h1><p className="text-slate-400 mb-6">Encontrá respuestas a las consultas más comunes</p><div className="relative max-w-lg"><div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div><input type="text" placeholder="Buscar preguntas..." className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" disabled /></div></div></div><div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12"><div className="space-y-4">{[1,2,3,4].map((i) => (<div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />))}</div></div></div>}>
    <FaqContent />
  </Suspense>
  );
}