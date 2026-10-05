'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { extractData } from '@/lib/api';
import { ArrowLeft, Globe, DollarSign, ExternalLink, Share2 } from 'lucide-react';
import { LlaveIcon } from '@/components/ui/LlaveIcon';

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

interface ProveedorServicios {
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
  servicios?: ServicioPublicado[];
}

const redesSociales: { clave: string; etiqueta: string }[] = [
  { clave: 'facebook', etiqueta: 'Facebook' },
  { clave: 'instagram', etiqueta: 'Instagram' },
  { clave: 'twitter', etiqueta: 'Twitter' },
  { clave: 'linkedin', etiqueta: 'LinkedIn' },
  { clave: 'youtube', etiqueta: 'YouTube' },
];

export default function ServiciosDelProveedorPage() {
  const params = useParams();
  const [proveedor, setProveedor] = useState<ProveedorServicios | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get(`/proveedores/${params.id}`);
      setProveedor(extractData<ProveedorServicios | null>(res));
    } catch {
      setProveedor(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!proveedor) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Proveedor no encontrado</h1>
        <Link href="/proveedores">
          <Button>Volver a proveedores</Button>
        </Link>
      </div>
    );
  }

  const servicios = proveedor.servicios || [];
  const nombreCompleto = [proveedor.nombre, proveedor.apellido].filter(Boolean).join(' ');
  const tieneContacto = Boolean(
    proveedor.sitio_web ||
    redesSociales.some(({ clave }) => proveedor.redes_sociales?.[clave])
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href={`/proveedores/${proveedor.id_usuario}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al perfil del proveedor
      </Link>

      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-2xl font-bold">{proveedor.nombre?.[0] || 'P'}</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white truncate">{nombreCompleto}</h1>
            <p className="text-slate-400">{proveedor.rubro_principal || 'Proveedor profesional'}</p>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
              <LlaveIcon className="w-4 h-4 text-yellow-400" aria-hidden="true" />
              <span>
                {Number(proveedor.calificacion_promedio ?? 0).toFixed(1)} ({proveedor.cantidad_valoraciones} reseñas)
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <CardTitle>Servicios disponibles</CardTitle>
        {servicios.length === 0 ? (
          <div className="mt-4 text-center py-8">
            <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Este proveedor aún no tiene servicios publicados</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {servicios.map((s) => (
              <div
                key={s.id_servicio_proveedor}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-700/30 rounded-lg"
              >
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-white">{s.nombre}</h4>
                  <p className="text-xs text-slate-400">
                    {[s.categoria, s.descripcion_personalizada].filter(Boolean).join(' · ')}
                  </p>
                  {!s.disponible && (
                    <p className="text-xs text-amber-400 mt-1">Temporalmente no disponible</p>
                  )}
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    {s.precio_estimado != null && (
                      <p className="text-sm font-semibold text-cyan-400">
                        ${Number(s.precio_estimado).toLocaleString('es-AR')}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">{s.moneda || 'ARS'}</p>
                  </div>
                  <Link href={`/servicios/${s.id_servicio}`}>
                    <Button size="sm" disabled={!s.disponible}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Contratar
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Contacto</CardTitle>
        <div className="mt-4 space-y-2 text-sm">
          {proveedor.sitio_web && (
            <a
              href={proveedor.sitio_web}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-400 hover:text-white"
            >
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
          {!tieneContacto && (
            <p className="text-slate-400">
              Este proveedor aún no publicó datos de contacto. Podés contratarlo directamente desde
              uno de sus servicios.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
