'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useAuthStore } from '@/store/auth';
import { formatDate } from '@/lib/utils';
import {
  FileText,
  Download,
  Pen,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import type { Contrato, FirmaDigital } from '@/types';

const estadoColors: Record<string, string> = {
  borrador: 'text-slate-400 bg-slate-700/50',
  pendiente_firma: 'text-yellow-400 bg-yellow-400/10',
  firmado: 'text-green-400 bg-green-400/10',
  cancelado: 'text-red-400 bg-red-400/10',
};

const MENSAJE_EVIDENCIA =
  'Al confirmar, se registrará tu firma electrónica con evidencia: hash SHA-256 del documento, fecha, IP y usuario autenticado. Recibirás un email con el comprobante de la firma.';

function mensajeDeError(e: unknown, fallback: string): string {
  const err = e as { response?: { data?: { message?: string | string[]; error?: string } } };
  const msg = err?.response?.data?.message ?? err?.response?.data?.error;
  if (Array.isArray(msg)) return msg[0] || fallback;
  return msg || fallback;
}

export default function ContratoDetallePage() {
  const params = useParams<{ id: string }>();
  const contratoId = params?.id;
  const user = useAuthStore((s) => s.user);

  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [cargando, setCargando] = useState(true);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [firmando, setFirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firmaRegistrada, setFirmaRegistrada] = useState<FirmaDigital | null>(null);

  const cargarContrato = useCallback(async () => {
    if (!contratoId) return;
    try {
      const res = await api.get(`/contratos/${contratoId}`);
      setContrato(extractData<Contrato>(res));
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo cargar el contrato.'));
    } finally {
      setCargando(false);
    }
  }, [contratoId]);

  useEffect(() => {
    cargarContrato();
  }, [cargarContrato]);

  const firmar = async () => {
    if (!contratoId) return;
    setFirmando(true);
    setError(null);
    try {
      const res = await api.post(`/contratos/${contratoId}/firmar`, {
        proveedor_firma: 'docusign',
      });
      setFirmaRegistrada(extractData<FirmaDigital>(res));
      await cargarContrato();
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo firmar el contrato. Intentá nuevamente.'));
    } finally {
      setFirmando(false);
      setDialogoAbierto(false);
    }
  };

  const abrirPdf = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (cargando) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="h-80 bg-slate-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="text-center py-10">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">{error || 'Contrato no encontrado'}</p>
            <Link
              href="/dashboard/contratos"
              className="text-cyan-400 text-sm mt-4 inline-block"
            >
              Volver a Mis Contratos
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const yaFirmo =
    !!firmaRegistrada ||
    (contrato.firmas ?? []).some(
      (f) => f.id_usuario === user?.id_usuario && f.estado === 'exitosa',
    );
  const puedeFirmar =
    contrato.estado === 'pendiente_firma' && !yaFirmo && !firmaRegistrada;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <Link
          href="/dashboard/contratos"
          className="text-cyan-400 text-sm inline-flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Mis Contratos
        </Link>
        <div className="text-center">
          <ShieldCheck className="w-10 h-10 text-cyan-400 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-white">
            Contrato #{contrato.id_contrato.slice(0, 8)}
          </h1>
        </div>
      </div>

      {firmaRegistrada && (
        <div className="px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl space-y-1">
          <div className="flex items-center gap-2 text-green-400 font-semibold">
            <CheckCircle2 className="w-5 h-5" />
            Contrato firmado correctamente
          </div>
          <p className="text-sm text-slate-300">
            Se registró tu firma electrónica y se envió un email con la evidencia
            (hash, fecha, IP, usuario).
          </p>
          <p className="text-xs text-slate-400">
            Hash: <span className="font-mono break-all">{firmaRegistrada.hash_documento || contrato.hash_documento}</span>
          </p>
          {firmaRegistrada.fecha_firma && (
            <p className="text-xs text-slate-400">
              Fecha: {formatDate(firmaRegistrada.fecha_firma)}
              {firmaRegistrada.ip_firma ? ` | IP: ${firmaRegistrada.ip_firma}` : ''}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <Card>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-300">Detalle del contrato</h2>
            <span
              className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${estadoColors[contrato.estado] || 'text-slate-400'}`}
            >
              {contrato.estado.replace('_', ' ')}
            </span>
          </div>

          <div className="text-sm text-slate-400 space-y-1">
            <p>
              <span className="text-slate-300">Tipo:</span> {contrato.tipo_contrato}
            </p>
            <p>
              <span className="text-slate-300">Generado:</span>{' '}
              {formatDate(contrato.fecha_generacion)}
            </p>
            {contrato.fecha_firma_cliente && (
              <p className="text-green-400">
                Firmado por cliente el {formatDate(contrato.fecha_firma_cliente)}
              </p>
            )}
            {contrato.fecha_firma_proveedor && (
              <p className="text-green-400">
                Firmado por proveedor el {formatDate(contrato.fecha_firma_proveedor)}
              </p>
            )}
          </div>

          {contrato.hash_documento && (
            <div className="text-xs text-slate-400">
              <p className="text-slate-300 mb-1">Hash SHA-256 del documento</p>
              <p className="font-mono break-all bg-slate-800/60 rounded p-2">
                {contrato.hash_documento}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700/50">
            {(contrato.url_pdf_firmado || contrato.url_pdf_borrador) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => abrirPdf(contrato.url_pdf_firmado || contrato.url_pdf_borrador!)}
              >
                <Download className="w-4 h-4 mr-1" />
                {contrato.url_pdf_firmado ? 'Descargar PDF firmado' : 'Descargar PDF borrador'}
              </Button>
            )}
            {puedeFirmar && (
              <Button size="sm" onClick={() => setDialogoAbierto(true)}>
                <Pen className="w-4 h-4 mr-1" />
                Firmar electrónicamente
              </Button>
            )}
            {contrato.estado === 'pendiente_firma' && yaFirmo && (
              <p className="text-sm text-slate-400 self-center">
                Ya firmaste este contrato. Esperamos la firma de la otra parte.
              </p>
            )}
            {contrato.estado === 'firmado' && (
              <p className="text-sm text-green-400 self-center">
                Este contrato fue firmado por ambas partes.
              </p>
            )}
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={dialogoAbierto}
        titulo="Confirmar firma"
        mensaje={MENSAJE_EVIDENCIA}
        confirmLabel="Confirmar firma"
        loading={firmando}
        onConfirm={firmar}
        onCancel={() => setDialogoAbierto(false)}
      />
    </div>
  );
}
