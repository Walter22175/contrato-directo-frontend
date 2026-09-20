'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Play, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Video {
  id: string;
  titulo: string;
  descripcion: string;
  duracion: string;
  thumbnail: string;
}

const videos: Video[] = [
  { id: '1', titulo: 'Bienvenido a Contrato Directo', descripcion: 'Conocé las funcionalidades principales de la plataforma', duracion: '2:30', thumbnail: '' },
  { id: '2', titulo: 'Cómo registrarse', descripcion: 'Guía rápida de registro para clientes y proveedores', duracion: '1:45', thumbnail: '' },
  { id: '3', titulo: 'Buscar y contratar servicios', descripcion: 'Encontrá el servicio perfecto en minutos', duracion: '3:10', thumbnail: '' },
  { id: '4', titulo: 'Proceso de pago seguro', descripcion: 'Cómo funciona la custodia de fondos con Mercado Pago', duracion: '2:50', thumbnail: '' },
  { id: '5', titulo: 'Sistema de valoraciones', descripcion: 'Valorá a tus proveedores y construí tu reputación', duracion: '1:20', thumbnail: '' },
  { id: '6', titulo: 'Espacio de mediación', descripcion: 'Resolvé conflictos de forma justa y transparente', duracion: '2:15', thumbnail: '' },
];

export default function VideosPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-slate-900/50 border-b border-slate-800 py-8">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
              <Link href="/ayuda" className="hover:text-cyan-400 transition-colors">Ayuda</Link>
              <span>/</span>
              <span className="text-white">Videos</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Videos Explicativos</h1>
            <p className="text-slate-400">Aprendé viendo cómo funciona la plataforma</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((v) => (
              <Card key={v.id} hover>
                <div className="p-4">
                  <div className="aspect-video bg-slate-700/50 rounded-lg flex items-center justify-center mb-4 relative group cursor-pointer">
                    <div className="w-16 h-16 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                      <Play className="w-8 h-8 text-cyan-400 ml-1" />
                    </div>
                    <span className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-1 rounded">
                      {v.duracion}
                    </span>
                  </div>
                  <h3 className="font-medium text-white mb-1">{v.titulo}</h3>
                  <p className="text-sm text-slate-400">{v.descripcion}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/ayuda/tutoriales"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Ver tutoriales paso a paso
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
