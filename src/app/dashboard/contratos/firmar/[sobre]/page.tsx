'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FileText, CheckCircle2, Circle, Loader2, ShieldCheck } from 'lucide-react';

interface FirmanteSobre {
  id_usuario: string;
  nombre: string;
  rol: string;
  firmo: boolean;
}

interface InfoSobre {
  id_sobre: string;
  id_contrato: string;
  estado: string;
  firmantes: FirmanteSobre[];
  ya_firmo: boolean;
  es_parte: boolean;
}

export default function FirmarSobrePage() {
  const params = useParams<{ sobre: string }>();
  const router = useRouter();
  const sobreId = params?.sobre;

  const [info, setInfo] = useState<InfoSobre | null>(null);
  const [cargando, setCargando] = useState(true);
  const [firmando, setFirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const cargarInfo = useCallback(async () => {
    if (!sobreId) return;
    try {
      const res = await api.get(`/firma-digital/sobres/${sobreId}`);
      setInfo(extractData<InfoSobre>(res));
    } catch (e) {
      const err = e as { response?: { data?: { message?: string | string[] } } };
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Sobre de firma no encontrado.');
    } finally {
      setCargando(false);
    }
  }, [sobreId]);

  useEffect(() => {
    cargarInfo();
  }, [cargarInfo]);

  const firmar = async () => {
    setFirmando(true);
    setError(null);
    try {
      await api.post(`/firma-digital/sobres/${sobreId}/firmar`, {});
      setExito(true);
      await cargarInfo();
      setTimeout(() => router.push('/dashboard/contratos'), 2000);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string | string[] } } };
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'No se pudo registrar la firma. Intentá nuevamente.');
    } finally {
      setFirmando(false);
    }
  };

  if (cargando) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="h-64 bg-slate-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="max-w-lg mx-auto">
        <Card>
          <div className="text-center py-10">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">{error || 'Sobre de firma no encontrado'}</p>
            <Link href="/dashboard/contratos" className="text-cyan-400 text-sm mt-4 inline-block">
              Volver a Mis Contratos
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const contratoFirmado = info.estado === 'firmado';
  const puedeFirmar = info.es_parte && !info.ya_firmo && !contratoFirmado && info.estado !== 'cancelado';

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="text-center">
        <ShieldCheck className="w-10 h-10 text-cyan-400 mx-auto mb-2" />
        <h1 className="text-2xl font-bold text-white">Firma Digital</h1>
        <p className="text-slate-400 text-sm mt-1">
          Contrato #{info.id_contrato.slice(0, 8)}
        </p>
      </div>

      <Card>
        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Firmantes</h2>
            <ul className="space-y-2">
              {info.firmantes.map((f) => (
                <li key={f.id_usuario} className="flex items-center gap-3">
                  {f.firmo ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  )}
                  <span className="text-sm text-white">{f.nombre || f.id_usuario.slice(0, 8)}</span>
                  <span className="text-xs text-slate-500 ml-auto capitalize">{f.rol}</span>
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          {exito ? (
            <div className="px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400">
              Firma registrada correctamente. Redirigiendo a tus contratos...
            </div>
          ) : puedeFirmar ? (
            <Button className="w-full" disabled={firmando} onClick={firmar}>
              {firmando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Firmando...
                </>
              ) : (
                'Firmar contrato'
              )}
            </Button>
          ) : info.ya_firmo ? (
            <p className="text-center text-sm text-slate-400">
              Ya firmaste este contrato.
            </p>
          ) : contratoFirmado ? (
            <p className="text-center text-sm text-green-400">
              Este contrato ya fue firmado por ambas partes.
            </p>
          ) : (
            <p className="text-center text-sm text-slate-400">
              Tu usuario no es una parte de este contrato.
            </p>
          )}

          <div className="text-center">
            <Link href="/dashboard/contratos" className="text-cyan-400 text-sm">
              Volver a Mis Contratos
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
