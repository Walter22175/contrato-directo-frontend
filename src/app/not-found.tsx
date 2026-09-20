'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-8xl font-bold text-cyan-500 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-2">Página no encontrada</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            La página que buscás no existe o fue movida a otro lugar.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              Inicio
            </Link>
            <Link
              href="/servicios"
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              Servicios
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
