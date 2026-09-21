'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { extractData } from '@/lib/api';
import {
  Star, Shield, Award, Clock, ArrowLeft, Globe, MessageSquare,
  TrendingUp, CheckCircle, DollarSign
} from 'lucide-react';
import type { PerfilProveedor, Usuario, ServicioProveedor, Valoracion } from '@/types';

type ProveedorDetalle = PerfilProveedor & { usuario?: Partial<Usuario> };

export default function ProveedorDetallePage() {
  const params = useParams();
  const [proveedor, setProveedor] = useState<ProveedorDetalle | null>(null);
  const [servicios, setServicios] = useState<ServicioProveedor[]>([]);
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [provRes, servRes, valRes] = await Promise.allSettled([
        api.get(`/proveedores/${params.id}`),
        api.get('/servicios', { params: { id_usuario: params.id } }),
        api.get('/valoraciones', { params: { id_evaluado: params.id } }),
      ]);
      const provData = provRes.status === 'fulfilled' ? extractData<any>(provRes.value) : null;
      const servData = servRes.status === 'fulfilled' ? extractData<any>(servRes.value) : null;
      const valData = valRes.status === 'fulfilled' ? extractData<any>(valRes.value) : null;
      setProveedor(provData);
      setServicios(servData?.data || servData || []);
      setValoraciones(valData?.data || valData || []);
    } catch {} finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatearFecha = (f: string) =>
    new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

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

  const promedio = valoraciones.length
    ? (valoraciones.reduce((acc, v) => acc + v.puntuacion, 0) / valoraciones.length).toFixed(1)
    : '0.0';

  const distribucion = [5, 4, 3, 2, 1].map((n) => ({
    stars: n,
    count: valoraciones.filter((v) => v.puntuacion === n).length,
  }));
  const maxCount = Math.max(...distribucion.map((d) => d.count), 1);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/proveedores" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver a proveedores
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile header */}
              <Card>
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0">
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
                      {proveedor.proveedor_destacado && (
                        <Award className="w-6 h-6 text-yellow-400" aria-label="Proveedor destacado" />
                      )}
                    </div>
                    <p className="text-slate-400">{proveedor.rubro_principal || 'Proveedor profesional'}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        {promedio} ({valoraciones.length} reseñas)
                      </span>
                      <span>{proveedor.antiguedad_meses} meses en plataforma</span>
                    </div>
                  </div>
                </div>

                <p className="text-slate-300 mb-6">
                  {proveedor.descripcion || 'Proveedor verificado en la plataforma Contrato Directo. Profesional comprometido con la calidad y la satisfacción del cliente.'}
                </p>

                {/* Stats */}
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
                    <p className="text-2xl font-bold text-cyan-400">{valoraciones.length}</p>
                    <p className="text-xs text-slate-400">Reseñas</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-cyan-400">{proveedor.antiguedad_meses}</p>
                    <p className="text-xs text-slate-400">Meses activo</p>
                  </div>
                </div>
              </Card>

              {/* Services */}
              <Card>
                <CardTitle>Servicios Offeredos</CardTitle>
                {servicios.length === 0 ? (
                  <div className="mt-4 text-center py-8">
                    <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">Aún no tiene servicios publicados</p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {servicios.map((s) => (
                      <div key={s.id_servicio_proveedor} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div>
                          <h4 className="text-sm font-medium text-white">{s.servicio?.nombre || 'Servicio'}</h4>
                          <p className="text-xs text-slate-400">{s.descripcion_personalizada || s.servicio?.descripcion || ''}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          {s.precio_estimado && (
                            <p className="text-sm font-semibold text-cyan-400">
                              ${s.precio_estimado.toLocaleString('es-AR')}
                            </p>
                          )}
                          <p className="text-xs text-slate-500">{s.moneda || 'ARS'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Reviews */}
              <Card>
                <CardTitle>Reseñas y Valoraciones</CardTitle>
                {valoraciones.length === 0 ? (
                  <div className="mt-4 text-center py-8">
                    <Star className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">Aún no tiene reseñas</p>
                  </div>
                ) : (
                  <div className="mt-4">
                    {/* Rating summary */}
                    <div className="flex items-center gap-6 mb-6 p-4 bg-slate-700/30 rounded-lg">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-white">{promedio}</p>
                        <div className="flex items-center gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${s <= Math.round(parseFloat(promedio)) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{valoraciones.length} reseñas</p>
                      </div>
                      <div className="flex-1 space-y-1">
                        {distribucion.map((d) => (
                          <div key={d.stars} className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 w-4">{d.stars}</span>
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400 rounded-full"
                                style={{ width: `${(d.count / maxCount) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 w-6 text-right">{d.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Review list (últimas 10) */}
                    <div className="space-y-3">
                      {valoraciones.slice(0, 10).map((v) => (
                        <div key={v.id_valoracion} className="p-3 border-b border-slate-700/50 last:border-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center">
                                <span className="text-xs text-slate-300">
                                  {v.tipo_evaluador === 'cliente' ? 'CL' : 'PV'}
                                </span>
                              </div>
                              <span className="text-sm text-white">
                                {v.tipo_evaluador === 'cliente' ? 'Cliente' : 'Proveedor'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3 h-3 ${s <= v.puntuacion ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
                                />
                              ))}
                            </div>
                          </div>
                          {v.comentario && (
                            <p className="text-sm text-slate-300 mt-1">{v.comentario}</p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">{formatearFecha(v.fecha_valoracion)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div>
              <Card className="sticky top-24">
                <CardTitle>Contactar</CardTitle>
                <div className="mt-4 space-y-4">
                  <Button className="w-full" size="lg">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Solicitar Servicio
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Globe className="w-5 h-5 mr-2" />
                    Ver Perfil Completo
                  </Button>
                  <hr className="border-slate-700" />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-4 h-4" />
                      Responde en ~24h
                    </div>
                    {proveedor.sitio_web && (
                      <a href={proveedor.sitio_web} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white">
                        <Globe className="w-4 h-4" />
                        Sitio web
                      </a>
                    )}
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
