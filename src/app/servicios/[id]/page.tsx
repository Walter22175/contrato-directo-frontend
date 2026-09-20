'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { extractData } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Star, MapPin, Shield, Clock, ArrowLeft, MessageSquare } from 'lucide-react';
import type { Servicio, ServicioProveedor } from '@/types';

export default function ServicioDetallePage() {
  const params = useParams();
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [proveedores, setProveedores] = useState<ServicioProveedor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/servicios/${params.id}`);
        const data = extractData<any>(res);
        setServicio(data);
        setProveedores(data?.servicios_proveedor || []);
      } catch {
        setServicio(null);
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

  if (!servicio) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Servicio no encontrado</h1>
            <Link href="/servicios">
              <Button>Volver a servicios</Button>
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
          <Link href="/servicios" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" />
            Volver a servicios
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2">
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white">{servicio.nombre}</h1>
                    <span className="text-sm text-slate-400 bg-slate-700/50 px-2 py-1 rounded mt-2 inline-block">
                      {servicio.categoria?.nombre || 'Servicio'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span className="text-lg font-semibold text-white">4.8</span>
                    <span className="text-sm text-slate-400">(12 reseñas)</span>
                  </div>
                </div>

                <p className="text-slate-300 mb-6">
                  {servicio.descripcion || 'Servicio profesional disponible en la plataforma Contrato Directo.'}
                </p>

                <div className="flex flex-wrap gap-2">
                  {servicio.palabras_clave?.map((kw, i) => (
                    <span key={i} className="text-xs bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full">
                      {kw}
                    </span>
                  ))}
                </div>
              </Card>

              {/* Providers */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Proveedores Disponibles ({proveedores.length})
                </h2>
                {proveedores.length === 0 ? (
                  <Card>
                    <p className="text-slate-400 text-center py-8">
                      No hay proveedores disponibles para este servicio aún.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {proveedores.map((sp) => (
                      <Link key={sp.id_servicio_proveedor} href={`/proveedores/${sp.id_usuario}`}>
                        <Card hover className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {sp.proveedor?.nombre?.[0] || 'P'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">
                              {sp.proveedor?.nombre} {sp.proveedor?.apellido}
                            </h3>
                            <p className="text-sm text-slate-400">
                              {sp.descripcion_personalizada || 'Proveedor verificado'}
                            </p>
                          </div>
                          <div className="text-right">
                            {sp.precio_estimado && (
                              <p className="text-lg font-bold text-cyan-400">
                                {formatCurrency(sp.precio_estimado)}
                              </p>
                            )}
                            <div className="flex items-center gap-1 text-sm text-slate-400">
                              <Star className="w-4 h-4 text-yellow-400" />
                              <span>4.9</span>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <Card className="sticky top-24">
                <CardTitle>Contratar Servicio</CardTitle>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Proveedores disponibles</span>
                    <span className="text-white font-medium">{proveedores.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Tiempo de respuesta</span>
                    <span className="text-white font-medium">~24h</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Comisión plataforma</span>
                    <span className="text-white font-medium">8%</span>
                  </div>
                  <hr className="border-slate-700" />
                  <Button className="w-full" size="lg">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Contactar Proveedor
                  </Button>
                  <p className="text-xs text-slate-500 text-center">
                    Al contactar, se generará un contrato con los términos acordados.
                  </p>
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
