'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  FileText,
  ArrowLeft,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface Verificacion {
  id_verificacion: number;
  tipo_documento: string;
  url_documento?: string;
  estado: string;
  fecha_envio?: string;
  fecha_limite_revision?: string | null;
  fecha_revision?: string | null;
  observaciones?: string | null;
  auto_aprobado?: boolean;
}

interface VerificacionResponse {
  sello_verificado: boolean;
  fecha_verificacion: string | null;
  verificaciones: Verificacion[];
}

const DOC_LABELS: Record<string, string> = {
  dni: 'DNI',
  cuit: 'CUIT/CUIL',
  doc_fiscal: 'Documentación Fiscal',
  avales: 'Avales',
};

const ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  aprobado: 'Aprobado',
  auto_aprobado: 'Auto-aprobado',
  rechazado: 'Rechazado',
  vencido: 'Plazo vencido',
};

const ESTADO_STYLES: Record<string, string> = {
  pendiente: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  en_revision: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  aprobado: 'text-green-400 bg-green-500/10 border-green-500/20',
  auto_aprobado: 'text-green-400 bg-green-500/10 border-green-500/20',
  rechazado: 'text-red-400 bg-red-500/10 border-red-500/20',
  vencido: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
};

const PENDIENTES = ['pendiente', 'en_revision'];
const REENVIABLES = ['rechazado', 'vencido'];

const fmtFecha = (f?: string | null) =>
  f
    ? new Date(f).toLocaleString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

export default function VerificacionProveedorPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState<VerificacionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sinPerfil, setSinPerfil] = useState(false);
  const [resubmitTipo, setResubmitTipo] = useState<string | null>(null);
  const [resubmitUrl, setResubmitUrl] = useState('');
  const [resubmitError, setResubmitError] = useState<string | null>(null);
  const [resubmitting, setResubmitting] = useState(false);

  const fetchDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/perfiles/proveedor/verificacion');
      setData(extractData<VerificacionResponse>(res));
      setSinPerfil(false);
    } catch (err) {
      const status = (err as { response?: { status?: number } } | undefined)?.response?.status;
      if (status === 404) {
        setSinPerfil(true);
      } else if (status === 403) {
        setError('Solo los proveedores pueden ver el estado de verificación.');
      } else {
        setError('No se pudo cargar el estado de verificación. Intentá nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchDatos();
  }, [isAuthenticated, router, fetchDatos]);

  const ultimasPorTipo = (verificaciones: Verificacion[]): Verificacion[] => {
    const mapa = new Map<string, Verificacion>();
    const ordenadas = [...verificaciones].sort(
      (a, b) => (b.id_verificacion || 0) - (a.id_verificacion || 0),
    );
    for (const v of ordenadas) {
      if (!mapa.has(v.tipo_documento)) mapa.set(v.tipo_documento, v);
    }
    return [...mapa.values()];
  };

  const handleReenviar = async () => {
    if (!resubmitTipo || !resubmitUrl.trim()) return;
    setResubmitting(true);
    setResubmitError(null);
    try {
      await api.post('/perfiles/proveedor/verificacion', {
        tipo_documento: resubmitTipo,
        url_documento: resubmitUrl.trim(),
      });
      setResubmitTipo(null);
      setResubmitUrl('');
      await fetchDatos();
    } catch (err) {
      const respuesta = (err as { response?: { data?: { message?: string | string[] } } } | undefined)?.response;
      const msg = respuesta?.data?.message || 'No se pudo reenviar la documentación.';
      setResubmitError(Array.isArray(msg) ? msg.join(' — ') : String(msg));
    } finally {
      setResubmitting(false);
    }
  };

  const docs = data ? ultimasPorTipo(data.verificaciones || []) : [];
  const enRevision = docs.filter((d) => PENDIENTES.includes(d.estado));
  const fechasLimite = enRevision
    .map((d) => d.fecha_limite_revision)
    .filter(Boolean)
    .sort() as string[];
  const proximaLimite = fechasLimite[0] || null;
  const limiteVencido = proximaLimite ? new Date(proximaLimite) < new Date() : false;

  if (loading) {
    return (
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (sinPerfil) {
    return (
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <div className="text-center py-12 px-6">
              <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h1 className="text-xl font-semibold text-white">Todavía no sos proveedor</h1>
              <p className="text-slate-400 mt-2">
                Completá el formulario de conversión para empezar la verificación de tu documentación.
              </p>
              <button
                onClick={() => router.push('/proveedores/convertir')}
                className="mt-6 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Convertirme en Proveedor
              </button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/perfil')}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              aria-label="Volver"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Estado de Verificación</h1>
              <p className="text-slate-400 text-sm mt-1">
                Seguimiento de la revisión de tu documentación
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
            {error}
          </div>
        )}

        <Card>
          <div className="p-6 flex items-start gap-4">
            {data?.sello_verificado ? (
              <ShieldCheck className="w-10 h-10 text-green-400 shrink-0" />
            ) : (
              <Clock className="w-10 h-10 text-cyan-400 shrink-0" />
            )}
            <div className="flex-1">
              <h2 className="font-semibold text-white">
                {data?.sello_verificado
                  ? 'Proveedor verificado'
                  : 'Verificación en curso'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {data?.sello_verificado
                  ? `Sello otorgado el ${fmtFecha(data.fecha_verificacion)}.`
                  : 'Nuestro equipo revisa tu documentación con un plazo máximo de 72 horas hábiles.'}
              </p>
              {proximaLimite && !data?.sello_verificado && (
                <p className={`text-xs mt-2 ${limiteVencido ? 'text-orange-400' : 'text-slate-500'}`}>
                  {limiteVencido
                    ? 'El plazo de revisión está vencido: tu solicitud está siendo priorizada.'
                    : `Plazo de revisión: hasta el ${fmtFecha(proximaLimite)}.`}
                </p>
              )}
            </div>
          </div>
        </Card>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-white mb-4">Documentos</h2>
          {docs.length === 0 ? (
            <Card>
              <div className="text-center py-10">
                <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No hay documentos en revisión</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {docs.map((doc) => (
                <Card key={doc.id_verificacion}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-medium text-white">
                          {DOC_LABELS[doc.tipo_documento] || doc.tipo_documento}
                        </h3>
                        {doc.fecha_envio && (
                          <p className="text-xs text-slate-500 mt-1">
                            Enviado: {fmtFecha(doc.fecha_envio)}
                          </p>
                        )}
                        {PENDIENTES.includes(doc.estado) && doc.fecha_limite_revision && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Revisión hasta: {fmtFecha(doc.fecha_limite_revision)}
                          </p>
                        )}
                        {doc.fecha_revision && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Revisado: {fmtFecha(doc.fecha_revision)}
                          </p>
                        )}
                        {doc.observaciones && (
                          <p className="text-xs text-slate-400 mt-1.5">{doc.observaciones}</p>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded border whitespace-nowrap ${
                          ESTADO_STYLES[doc.estado] || 'text-slate-400 bg-slate-500/10 border-slate-600'
                        }`}
                      >
                        {ESTADO_LABELS[doc.estado] || doc.estado}
                      </span>
                    </div>

                    {REENVIABLES.includes(doc.estado) && resubmitTipo !== doc.tipo_documento && (
                      <button
                        onClick={() => {
                          setResubmitTipo(doc.tipo_documento);
                          setResubmitUrl('');
                          setResubmitError(null);
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reenviar documentación
                      </button>
                    )}

                    {resubmitTipo === doc.tipo_documento && (
                      <div className="mt-3 space-y-2">
                        <input
                          type="url"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          placeholder="https://url del documento (Drive, Dropbox, etc.)"
                          value={resubmitUrl}
                          onChange={(e) => setResubmitUrl(e.target.value)}
                        />
                        {resubmitError && (
                          <p className="text-xs text-red-400">{resubmitError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={handleReenviar}
                            disabled={resubmitting || !resubmitUrl.trim()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            {resubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Enviar
                          </button>
                          <button
                            onClick={() => setResubmitTipo(null)}
                            className="px-3 py-1.5 text-slate-400 hover:text-white text-xs transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 text-xs text-slate-500 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          SLA de revisión: 72 horas hábiles (lunes a viernes, 9 a 18 h) desde el envío.
        </div>
      </div>
    </main>
  );
}
