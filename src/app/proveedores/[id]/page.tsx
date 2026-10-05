'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { extractData } from '@/lib/api';
import {
  Shield, Award, Clock, ArrowLeft, Globe, MessageSquare,
  DollarSign, Share2
} from 'lucide-react';
import { LlaveIcon } from '@/components/ui/LlaveIcon';

interface DistribucionLlaves {
  llaves: number;
  cantidad: number;
}

interface ServicioPublicado {
  id_servicio_proveedor: number;
  id_servicio: number;
  nombre: string;
  categoria?: string;
  precio_estimado?: number | null;
  moneda?: string;
  descripcion_personalizada?: string;
  disponible: boolean;
}

interface ValoracionPublica {
  id_valoracion: string;
  puntuacion: number;
  comentario?: string;
  fecha_valoracion: string;
  evaluador?: { nombre?: string; apellido?: string };
}

interface ProveedorDetalle {
  id_usuario: string;
  nombre?: string;
  apellido?: string;
  rubro_principal?: string;
  descripcion?: string;
  sitio_web?: string;
  redes_sociales?: Record<string, string>;
  sello_verificado: boolean;
  proveedor_destacado: boolean;
  calificacion_promedio?: number | null;
  cantidad_valoraciones: number;
  tasa_respuesta?: number | null;
  tasa_cumplimiento?: number | null;
  antiguedad_meses: number;
  distribucion_llaves?: DistribucionLlaves[];
  porcentaje_recomiendan?: number;
  servicios?: ServicioPublicado[];
  valoraciones?: ValoracionPublica[];
}

const redesSociales: { clave: string; etiqueta: string }[] = [
  { clave: 'facebook', etiqueta: 'Facebook' },
  { clave: 'instagram', etiqueta: 'Instagram' },
  { clave: 'twitter', etiqueta: 'Twitter' },
  { clave: 'linkedin', etiqueta: 'LinkedIn' },
  { clave: 'youtube', etiqueta: 'YouTube' },
];

export default function ProveedorDetallePage() {
  const params = useParams();
  const [proveedor, setProveedor] = useState<ProveedorDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get(`/proveedores/${params.id}`);
      setProveedor(extractData<ProveedorDetalle | null>(res));
    } catch {
      setProveedor(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatearFecha = (f: string) =>
    new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatearAntiguedad = (meses?: number) => {
    const total = meses || 0;
    if (total < 12) return `${total} ${total === 1 ? 'mes' : 'meses'}`;
    const anios = Math.floor(total / 12);
    const resto = total % 12;
    const texto = `${anios} ${anios === 1 ? 'año' : 'años'}`;
    return resto > 0 ? `${texto} y ${resto} meses` : texto;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
        </main>
      </div>
    );
  }

  if (!proveedor) {
    return (
      <div className="min-h-screen flex flex-col">
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

  const servicios = proveedor.servicios || [];
  const valoraciones = proveedor.valoraciones || [];
  const promedio = Number(proveedor.calificacion_promedio ?? 0).toFixed(1);
  const distribucion = (proveedor.distribucion_llaves || [])
    .slice()
    .reverse()
    .map((d) => ({ stars: d.llaves, count: d.cantidad }));
  const maxCount = Math.max(...distribucion.map((d) => d.count), 1);
  const nombreCompleto = [proveedor.nombre, proveedor.apellido].filter(Boolean).join(' ');

  return (
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
            <div id="perfil" className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-3xl font-bold">
                  {proveedor.nombre?.[0] || 'P'}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white">{nombreCompleto}</h1>
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
                    <LlaveIcon className="w-4 h-4 text-yellow-400" aria-hidden="true" />
                    {promedio} ({proveedor.cantidad_valoraciones} reseñas)
                  </span>
                  <span>{formatearAntiguedad(proveedor.antiguedad_meses)} en la plataforma</span>
                </div>
              </div>
            </div>

            <p className="text-slate-300 mb-6">
              {proveedor.descripcion || 'Proveedor verificado en la plataforma Contrato Directo. Profesional comprometido con la calidad y la satisfacción del cliente.'}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-cyan-400">
                  {proveedor.tasa_cumplimiento != null ? `${Math.round(proveedor.tasa_cumplimiento)}%` : '—'}
                </p>
                <p className="text-xs text-slate-400">Cumplimiento</p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-cyan-400">
                  {proveedor.tasa_respuesta != null ? `${Math.round(proveedor.tasa_respuesta)}%` : '—'}
                </p>
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

          {/* Services */}
          <Card>
            <CardTitle>Servicios Ofrecidos</CardTitle>
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
                      <h4 className="text-sm font-medium text-white">{s.nombre}</h4>
                      <p className="text-xs text-slate-400">
                        {[s.categoria, s.descripcion_personalizada].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      {s.precio_estimado != null && (
                        <p className="text-sm font-semibold text-cyan-400">
                          ${Number(s.precio_estimado).toLocaleString('es-AR')}
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
                <LlaveIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" aria-hidden="true" />
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
                        <LlaveIcon
                          key={s}
                          className={`w-4 h-4 ${s <= Math.round(Number(promedio)) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{proveedor.cantidad_valoraciones} reseñas</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    {distribucion.map((d) => (
                      <div key={d.stars} className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 w-4">{d.stars}</span>
                        <LlaveIcon className="w-3 h-3 text-yellow-400 fill-yellow-400" aria-hidden="true" />
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
                              {v.evaluador?.nombre?.[0] || 'U'}
                            </span>
                          </div>
                          <span className="text-sm text-white">
                            {[v.evaluador?.nombre, v.evaluador?.apellido].filter(Boolean).join(' ') || 'Usuario'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <LlaveIcon
                              key={s}
                              className={`w-3 h-3 ${s <= v.puntuacion ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
                              aria-hidden="true"
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
              <Link href={`/proveedores/${proveedor.id_usuario}/servicios`} className="block">
                <Button className="w-full" size="lg">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Solicitar Servicio
                </Button>
              </Link>
              <a href="#perfil">
                <Button variant="outline" className="w-full">
                  <Globe className="w-5 h-5 mr-2" />
                  Ver Perfil Completo
                </Button>
              </a>
              <hr className="border-slate-700" />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-4 h-4" />
                  {proveedor.tasa_respuesta != null
                    ? `Responde el ${Math.round(proveedor.tasa_respuesta)}% de las consultas`
                    : 'Tiempo de respuesta sin datos'}
                </div>
                {proveedor.sitio_web && (
                  <a href={proveedor.sitio_web} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white">
                    <Globe className="w-4 h-4" />
                    Sitio web
                  </a>
                )}
                {redesSociales
                  .filter(({ clave }) => proveedor.redes_sociales?.[clave])
                  .map(({ clave, etiqueta }) => (
                    <a
                      key={clave}
                      href={proveedor.redes_sociales?.[clave]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-slate-400 hover:text-white"
                    >
                      <Share2 className="w-4 h-4" />
                      {etiqueta}
                    </a>
                  ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
