'use client';

import { Suspense } from 'react';
import ServiciosContent from './ServiciosContent';

const ServiciosFallback = () => (
  <div className="min-h-screen flex flex-col">
    <div className="bg-slate-900/50 border-b border-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-6">Buscar Servicios</h1>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" placeholder="¿Qué servicio buscás?" className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" disabled />
          </div>
          <div className="w-full md:w-64">
            <select className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" disabled>
              <option>Todas las categorías</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1,2,3].map((i) => (
          <div key={i} className="h-48 bg-slate-800/50 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

export default function ServiciosPage() {
  return (
    <Suspense fallback={<ServiciosFallback />}>
      <ServiciosContent />
    </Suspense>
  );
}