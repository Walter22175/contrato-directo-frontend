'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';
import { Search, Star, Shield, MapPin } from 'lucide-react';
import type { PerfilProveedor, Usuario } from '@/types';

type ProveedorConPerfil = PerfilProveedor & { usuario?: Partial<Usuario> };

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<ProveedorConPerfil[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const { data } = await api.get('/proveedores');
        setProveedores(data.data || data || []);
      } catch {
        setProveedores([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProveedores();
  }, []);

  const filtrados = proveedores.filter((p) => {
    if (!busqueda) return true;
    const search = busqueda.toLowerCase();
    return (
      p.rubro_principal?.toLowerCase().includes(search) ||
      p.descripcion?.toLowerCase().includes(search) ||
      p.usuario?.nombre?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-slate-900/50 border-b border-slate-800 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-white mb-6">Proveedores</h1>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por rubro o nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-slate-400 mb-6">
            {loading ? 'Cargando...' : `${filtrados.length} proveedores encontrados`}
          </p>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No se encontraron proveedores</h2>
              <p className="text-slate-400">Intentá con otros términos de búsqueda</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtrados.map((prov) => (
                <Link key={prov.id_perfil_proveedor} href={`/proveedores/${prov.id_usuario}`}>
                  <Card hover className="h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-xl font-bold">
                          {prov.usuario?.nombre?.[0] || 'P'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {prov.usuario?.nombre} {prov.usuario?.apellido}
                        </h3>
                        <p className="text-sm text-slate-400">{prov.rubro_principal || 'Proveedor'}</p>
                      </div>
                    </div>

                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                      {prov.descripcion || 'Proveedor verificado en la plataforma'}
                    </p>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-white">{prov.calificacion_promedio?.toFixed(1) || '0.0'}</span>
                        <span className="text-slate-500">({prov.cantidad_valoraciones})</span>
                      </div>
                      {prov.sello_verificado && (
                        <div className="flex items-center gap-1 text-cyan-400">
                          <Shield className="w-4 h-4" />
                          <span className="text-xs">Verificado</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
                      <span>{prov.tasa_cumplimiento?.toFixed(0) || '95'}% cumplimiento</span>
                      <span>{prov.antiguedad_meses} meses en plataforma</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
