'use client';

import { useState } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { mensajeError } from '@/lib/api';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export interface ConfirmacionAccion {
  titulo: string;
  mensaje: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  ejecutar: () => Promise<void>;
}

export interface MsgAccion {
  tipo: 'ok' | 'error';
  texto: string;
}

/**
 * Hook compartido para las acciones administrativas de la torre de control:
 * confirmación modal + spinner + banner de resultado (ok/error).
 */
export function useAccionAdmin() {
  const [confirmando, setConfirmando] = useState<ConfirmacionAccion | null>(null);
  const [ejecutando, setEjecutando] = useState(false);
  const [msg, setMsg] = useState<MsgAccion | null>(null);

  const pedir = (c: ConfirmacionAccion) => {
    setMsg(null);
    setConfirmando(c);
  };

  const cancelar = () => {
    if (!ejecutando) setConfirmando(null);
  };

  const confirmar = async () => {
    if (!confirmando) return;
    setEjecutando(true);
    try {
      await confirmando.ejecutar();
      setConfirmando(null);
    } catch (e) {
      setMsg({ tipo: 'error', texto: mensajeError(e, 'No se pudo ejecutar la acción') });
    } finally {
      setEjecutando(false);
    }
  };

  const ok = (texto: string) => setMsg({ tipo: 'ok', texto });
  const err = (texto: string) => setMsg({ tipo: 'error', texto });
  const cerrarMsg = () => setMsg(null);

  return { confirmando, ejecutando, msg, pedir, cancelar, confirmar, ok, err, cerrarMsg };
}

export type AccionAdmin = ReturnType<typeof useAccionAdmin>;

export function BannerAccion({ msg, onCerrar }: { msg: MsgAccion | null; onCerrar: () => void }) {
  if (!msg) return null;
  const esOk = msg.tipo === 'ok';
  return (
    <div
      role="status"
      className={`mb-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-xs ${
        esOk
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
          : 'border-red-500/30 bg-red-500/10 text-red-200'
      }`}
    >
      {esOk ? (
        <CheckCircle2 className="mt-0.5 w-4 h-4 flex-shrink-0" />
      ) : (
        <AlertTriangle className="mt-0.5 w-4 h-4 flex-shrink-0" />
      )}
      <span className="flex-1">{msg.texto}</span>
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar aviso"
        className="opacity-70 hover:opacity-100"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function DialogoAccion({ state }: { state: AccionAdmin }) {
  return (
    <ConfirmDialog
      open={state.confirmando !== null}
      titulo={state.confirmando?.titulo ?? ''}
      mensaje={state.confirmando?.mensaje ?? ''}
      confirmLabel={state.confirmando?.confirmLabel ?? 'Sí, ejecutar'}
      variant={state.confirmando?.variant ?? 'primary'}
      loading={state.ejecutando}
      onConfirm={() => void state.confirmar()}
      onCancel={state.cancelar}
    />
  );
}
