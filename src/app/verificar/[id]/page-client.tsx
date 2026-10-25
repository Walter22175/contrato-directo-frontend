'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api, { extractData } from '@/lib/api';
import { ShieldCheck, ShieldAlert, ShieldQuestion, Loader2 } from 'lucide-react';

interface ResultadoVerificacion {
  id_contrato: string;
  tipo_contrato: string;
  estado: string;
  fecha_generacion: string;
  fecha_firma_cliente: string | null;
  fecha_firma_proveedor: string | null;
  hash_documento: string | null;
  firmas_registradas: number;
  autentico: boolean;
  verificado_en: string;
}

const estadoLabels: Record<string, string> = {
  borrador: 'Borrador (pendiente de firma)',
  pendiente_firma: 'Pendiente de firma',
  firmado: 'Firmado por ambas partes',
  cancelado: 'Cancelado',
};

const fecha = (f: string | null | undefined) =>
  f ? new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

export default function VerificarContratoPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [resultado, setResultado] = useState<ResultadoVerificacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/contratos/${id}/verificar`)
      .then((res) => setResultado(extractData<ResultadoVerificacion>(res)))
      .catch(() => setNoEncontrado(true))
      .finally(() => setCargando(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="text-cyan-400 font-bold text-lg">
            Contrato Directo
          </Link>
          <h1 className="text-xl font-bold text-white mt-4">Verificación de Contrato</h1>
          <p className="text-slate-400 text-sm mt-1">
            Verificá la autenticidad de un contrato digital
          </p>
        </div>

        {cargando ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
            <p className="text-slate-400 text-sm mt-3">Verificando contrato...</p>
          </div>
        ) : noEncontrado || !resultado ? (
          <div className="bg-slate-900 border border-red-500/30 rounded-xl p-8 text-center">
            <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-white mb-1">Contrato no encontrado</h2>
            <p className="text-slate-400 text-sm">
              No existe un contrato con el ID <span className="font-mono">{id}</span> en nuestro sistema.
            </p>
          </div>
        ) : (
          <div
            className={`bg-slate-900 border rounded-xl p-8 ${
              resultado.autentico && resultado.estado === 'firmado'
                ? 'border-green-500/30'
                : 'border-yellow-500/30'
            }`}
          >
            <div className="text-center mb-6">
              {resultado.autentico && resultado.estado === 'firmado' ? (
                <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-3" />
              ) : (
                <ShieldQuestion className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              )}
              <h2 className="text-lg font-semibold text-white">
                {resultado.autentico && resultado.estado === 'firmado'
                  ? 'Contrato Válido'
                  : 'Contrato sin firmas completas'}
              </h2>
              <p className="text-slate-400 text-sm mt-1 capitalize">
                {estadoLabels[resultado.estado] || resultado.estado}
              </p>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">ID Contrato</dt>
                <dd className="text-white font-mono text-right break-all">{resultado.id_contrato}</dd>
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
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Firmas registradas</dt>
                <dd className="text-white text-right">{resultado.firmas_registradas}</dd>
              </div>
              {resultado.hash_documento && (
                <div className="pt-3 border-t border-slate-800">
                  <dt className="text-slate-400 mb-1">Hash SHA-256</dt>
                  <dd className="text-slate-300 font-mono text-xs break-all">
                    {resultado.hash_documento}
                  </dd>
                </div>
              )}
            </dl>

            <p className="text-center text-xs text-slate-500 mt-6">
              Verificado el {fecha(resultado.verificado_en)}
            </p>
          </div>
        )}

        <div className="text-center mt-6">
          <Link href="/" className="text-cyan-400 text-sm">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
