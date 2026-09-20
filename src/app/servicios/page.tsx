'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import api, { extractData } from '@/lib/api';
import { Search, Star } from 'lucide-react';
import type { Servicio, Categoria } from '@/types';

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [servRes, catRes] = await Promise.all([
          api.get('/servicios', { params: { activo: true } }),
          api.get('/catalogo/categorias', { params: { activa: true } }),
        ]);
        const servRaw = extractData<any>(servRes);
        const catRaw = extractData<any>(catRes);
        setServicios(servRaw?.data || servRaw || []);
        setCategorias(catRaw?.data || catRaw || []);
      } catch (e) {
        console.error('Error fetching servicios:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return servicios.filter((s) => {
      const matchBusqueda = !busqueda || s.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const matchCategoria = !categoria || s.id_categoria?.toString() === categoria;
      return matchBusqueda && matchCategoria;
    });
  }, [servicios, busqueda, categoria]);

  const opcionesCategorias = useMemo(
    () => categorias.map((c) => ({ value: c.id_categoria.toString(), label: c.nombre })),
    [categorias],
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-slate-900/50 border-b border-slate-800 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-white mb-6">Buscar Servicios</h1>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="¿Qué servicio buscás?"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div className="w-full md:w-64">
                <Select
                  options={opcionesCategorias}
                  placeholder="Todas las categorías"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-slate-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <p className="text-slate-400 mb-6">{filtered.length} servicios encontrados</p>
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2">No se encontraron servicios</h2>
                  <p className="text-slate-400">Intentá con otros términos de búsqueda</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((s) => (
                    <Link key={s.id_servicio} href={`/servicios/${s.id_servicio}`}>
                      <Card hover className="h-full">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-cyan-400 text-lg">🔧</span>
                          </div>
                          <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">
                            {s.categoria?.nombre || 'Servicio'}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">{s.nombre}</h3>
                        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                          {s.descripcion || 'Sin descripción'}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-slate-400">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span>4.8</span>
                          </div>
                          <span className="text-cyan-400 font-medium">
                            {s.servicios_proveedor?.length || 0} proveedores
                          </span>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
