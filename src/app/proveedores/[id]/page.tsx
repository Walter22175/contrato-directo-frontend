'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { extractData } from '@/lib/api';
import { Star, Shield, Clock, ArrowLeft, MapPin, Globe, MessageSquare } from 'lucide-react';
import type { PerfilProveedor, Usuario } from '@/types';

type ProveedorDetalle = PerfilProveedor & { usuario?: Partial<Usuario> };

export default function ProveedorDetallePage() {
  const params = useParams();
  const [proveedor, setProveedor] = useState<ProveedorDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/proveedores/${params.id}`);
        const data = extractData<any>(res);
        setProveedor(data);
      } catch {
        setProveedor(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
        </main>
      </div>
    );
  }

  if (!proveedor) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Proveedor no encontrado</h1>
            <Link href="/proveedores">
              <Button>Volver a proveedores</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/proveedores" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" />
            Volver a proveedores
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile */}
            <div className="lg:col-span-2">
              <Card>
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">
                      {proveedor.usuario?.nombre?.[0] || 'P'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold text-white">
                        {proveedor.usuario?.nombre} {proveedor.usuario?.apellido}
                      </h1>
                      {proveedor.sello_verificado && (
                        <Shield className="w-6 h-6 text-cyan-400" aria-label="Proveedor verificado" />
                      )}
                    </div>
                    <p className="text-slate-400">{proveedor.rubro_principal || 'Proveedor profesional'}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        {proveedor.calificacion_promedio?.toFixed(1) || '0.0'}
                        ({proveedor.cantidad_valoraciones} reseñas)
                      </span>
                      <span>{proveedor.antiguedad_meses} meses</span>
                    </div>
                  </div>
                </div>

                <p className="text-slate-300 mb-6">
                  {proveedor.descripcion || 'Proveedor verificado en la plataforma Contrato Directo. Profesional comprometido con la calidad y la satisfacción del cliente.'}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-cyan-400">{proveedor.tasa_cumplimiento?.toFixed(0) || '95'}%</p>
                    <p className="text-xs text-slate-400">Cumplimiento</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-cyan-400">{proveedor.tasa_respuesta?.toFixed(0) || '90'}%</p>
                    <p className="text-xs text-slate-400">Respuesta</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-cyan-400">{proveedor.cantidad_valoraciones}</p>
                    <p className="text-xs text-slate-400">Reseñas</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-cyan-400">{proveedor.antiguedad_meses}</p>
                    <p className="text-xs text-slate-400">Meses activo</p>
                  </div>
                </div>
              </Card>

              {/* Reviews Section Placeholder */}
              <Card className="mt-6">
                <CardTitle>Reseñas</CardTitle>
                <div className="mt-4 text-center py-8">
                  <Star className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Las reseñas aparecerán aquí cuando haya valoraciones.</p>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div>
              <Card className="sticky top-24">
                <CardTitle>Contactar</CardTitle>
                <div className="mt-4 space-y-4">
                  <Button className="w-full" size="lg">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Enviar Mensaje
                  </Button>
                  <Button variant="outline" className="w-full">
                    Ver Servicios
                  </Button>
                  <hr className="border-slate-700" />
                  <div className="space-y-2 text-sm">
                    {proveedor.sitio_web && (
                      <a href={proveedor.sitio_web} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white">
                        <Globe className="w-4 h-4" />
                        Sitio web
                      </a>
                    )}
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-4 h-4" />
                      Responde en ~24h
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
