'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth';
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Search,
  Download,
  BadgeCheck,
} from 'lucide-react';

interface FirmaEvidencia {
  id_firma: string;
  id_usuario: string;
  nombre: string | null;
  email: string | null;
  fecha_firma: string;
  ip_firma: string | null;
  proveedor_firma: string;
  hash_documento: string;
  estado: string;
}

interface ResultadoVerificacionHash {
  encontrado: boolean;
  hash_consultado: string;
  id_contrato?: string;
  tipo_contrato?: string;
  estado?: string;
  fecha_generacion?: string;
  fecha_firma_cliente?: string | null;
  fecha_firma_proveedor?: string | null;
  hash_documento?: string | null;
  firmas_registradas?: number;
  firmas?: FirmaEvidencia[];
  url_pdf_firmado?: string | null;
  verificado_en: string;
}

const estadoContratoLabels: Record<string, string> = {
  borrador: 'Borrador (pendiente de firma)',
  pendiente_firma: 'Pendiente de firma',
  firmado: 'Firmado por ambas partes',
  cancelado: 'Cancelado',
};

const estadoFirmaColors: Record<string, string> = {
  exitosa: 'text-green-400 bg-green-400/10',
  fallida: 'text-red-400 bg-red-400/10',
  pendiente: 'text-yellow-400 bg-yellow-400/10',
};

const fecha = (f: string | null | undefined) =>
  f
    ? new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

const fechaHora = (f: string | null | undefined) =>
  f
    ? new Date(f).toLocaleString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export default function VerificarFirmaContent() {
  const user = useAuthStore((s) => s.user);
  const searchParams = useSearchParams();
  const hashParam = searchParams?.get('hash') ?? null;

  const [hash, setHash] = useState('');
  const [resultado, setResultado] = useState<ResultadoVerificacionHash | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const ejecutarVerificacion = useCallback(async (hashLimpio: string) => {
    setResultado(null);
    setError(null);
    setCargando(true);
    try {
      const res = await api.get(`/contratos/verificar?hash=${hashLimpio}`);
      setResultado(extractData<ResultadoVerificacionHash>(res));
    } catch {
      setError('No se pudo verificar el hash. Intentá nuevamente.');
    } finally {
      setCargando(false);
    }
  }, []);

  // Auto-carga al escanear un QR: /verificar-firma?hash=<SHA-256>
  useEffect(() => {
    if (!hashParam) return;
    const limpio = hashParam.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(limpio)) {
      setError('El hash recibido en el enlace no es válido.');
      return;
    }
    setHash(limpio);
    void ejecutarVerificacion(limpio);
  }, [hashParam, ejecutarVerificacion]);

  const verificar = async (e: React.FormEvent) => {
    e.preventDefault();
    const hashLimpio = hash.trim().toLowerCase();

    if (!/^[0-9a-f]{64}$/.test(hashLimpio)) {
      setResultado(null);
      setError('Ingresá un hash SHA-256 válido (64 caracteres hexadecimales).');
      return;
    }

    await ejecutarVerificacion(hashLimpio);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Link href="/" className="text-cyan-400 font-bold text-lg">
            Contrato Directo
          </Link>
          <h1 className="text-xl font-bold text-white mt-4">Verificador de Evidencia</h1>
          <p className="text-slate-400 text-sm mt-1">
            Ingresá el hash SHA-256 del contrato para validar su firma y ver la evidencia
          </p>
        </div>

        <form
          onSubmit={verificar}
          className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4"
        >
          <div>
            <label htmlFor="hash" className="block text-sm text-slate-300 mb-2">
              Hash SHA-256
            </label>
            <input
              id="hash"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              placeholder="a3f9c8d1e4b2..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={cargando}>
            {cargando ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Verificar
              </>
            )}
          </Button>
        </form>

        {resultado && !resultado.encontrado && (
          <div className="bg-slate-900 border border-red-500/30 rounded-xl p-8 text-center mt-6">
            <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-white mb-1">
              No se encontró evidencia para este hash
            </h2>
            <p className="text-slate-400 text-sm">
              El hash <span className="font-mono break-all">{resultado.hash_consultado}</span> no
              corresponde a ningún contrato registrado en la plataforma.
            </p>
          </div>
        )}

        {resultado?.encontrado && (
          <div className="bg-slate-900 border border-green-500/30 rounded-xl p-8 mt-6 space-y-6">
            <div className="text-center">
              <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-white">Contrato Válido</h2>
              <p className="text-slate-400 text-sm mt-1 capitalize">
                {estadoContratoLabels[resultado.estado || ''] || resultado.estado}
              </p>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">ID Contrato</dt>
                <dd className="text-white font-mono text-right break-all">
                  {resultado.id_contrato}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Tipo</dt>
                <dd className="text-white capitalize text-right">{resultado.tipo_contrato}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Generado</dt>
                <dd className="text-white text-right">{fecha(resultado.fecha_generacion)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Firma cliente</dt>
                <dd className="text-white text-right">{fecha(resultado.fecha_firma_cliente)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Firma proveedor</dt>
                <dd className="text-white text-right">{fecha(resultado.fecha_firma_proveedor)}</dd>
              </div>
              <div className="pt-3 border-t border-slate-800">
                <dt className="text-slate-400 mb-1">Hash verificado</dt>
                <dd className="text-slate-300 font-mono text-xs break-all">
                  {resultado.hash_consultado}
                </dd>
              </div>
            </dl>

            {resultado.firmas && resultado.firmas.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">
                  Evidencia de firmas ({resultado.firmas_registradas} exitosa
                  {resultado.firmas_registradas === 1 ? '' : 's'})
                </h3>
                <ul className="space-y-3">
                  {resultado.firmas.map((f) => (
                    <li
                      key={f.id_firma}
                      className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 text-sm space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white font-medium">
                          {f.nombre || f.id_usuario.slice(0, 8)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                            estadoFirmaColors[f.estado] || 'text-slate-400'
                          }`}
                        >
                          {f.estado}
                        </span>
                      </div>
                      {f.email && <p className="text-slate-400">{f.email}</p>}
                      <p className="text-slate-400">Fecha: {fechaHora(f.fecha_firma)}</p>
                      <p className="text-slate-400">IP: {f.ip_firma || '—'}</p>
                      <p className="text-slate-400 capitalize">Proveedor: {f.proveedor_firma}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-4 border-t border-slate-800">
              {resultado.url_pdf_firmado && (
                <a
                  href={resultado.url_pdf_firmado}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descargar PDF firmado
                </a>
              )}
              {user && resultado.id_contrato && (
                <Link
                  href={`/dashboard/contratos/${resultado.id_contrato}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <BadgeCheck className="w-4 h-4" />
                  Ver contrato
                </Link>
              )}
            </div>

            <p className="text-center text-xs text-slate-500">
              Verificado el {fecha(resultado.verificado_en)}
            </p>
          </div>
        )}

        <div className="text-center mt-6 space-y-2">
          <p className="text-slate-500 text-sm">
            También podés verificar un contrato por su ID desde el link de verificación incluido
            en tu contrato o email de confirmación.
          </p>
          <Link href="/" className="text-cyan-400 text-sm">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
