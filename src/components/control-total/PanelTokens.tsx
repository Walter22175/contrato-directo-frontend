'use client';

import { Card } from '@/components/ui/Card';
import { Chip, Semaforo } from './Semaforo';
import { descargarCsv, fmtFecha } from '@/lib/control-total';
import type { PanelTokens } from '@/lib/control-total';
import { Download, KeyRound } from 'lucide-react';

export function PanelTokensSeccion({ datos }: { datos: PanelTokens | null }) {
  if (!datos) return null;

  const exportar = () => {
    const filas: string[] = [
      'id_usuario,mp_user_id,token_valido,expira,scopes,ultimo_error,marketplace_habilitado,semaforo',
      ...datos.tokens.map((t) =>
        [
          t.id_usuario,
          t.mp_user_id ?? '',
          t.token_valido ?? '',
          t.mp_token_expires_at ?? '',
          t.mp_scopes ?? '',
          `"${(t.ultimo_error_token ?? '').replace(/"/g, '""')}"`,
          t.marketplace_habilitado,
          t.semaforo,
        ].join(','),
      ),
    ];
    descargarCsv('control-total-tokens', filas);
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h3 className="font-medium text-white text-sm">
          Tokens OAuth de Mercado Pago · {datos.tokens.length} cuentas
        </h3>
        <ButtonCsv onClick={exportar} />
      </div>
      <p className="text-[11px] text-slate-500 mb-4 flex items-center gap-1">
        <KeyRound className="w-3 h-3" />
        Por seguridad nunca se muestran mp_access_token, mp_refresh_token ni code_verifier.
      </p>

      {datos.tokens.length === 0 ? (
        <p className="text-sm text-slate-500">Ninguna cuenta conectada a Mercado Pago todavía.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800">
                <th className="text-left py-2 pr-3">Proveedor</th>
                <th className="text-left py-2 pr-3">mp_user_id</th>
                <th className="text-left py-2 pr-3">Válido</th>
                <th className="text-left py-2 pr-3">Expira</th>
                <th className="text-left py-2 pr-3">Scopes</th>
                <th className="text-left py-2 pr-3">Último error</th>
                <th className="text-left py-2 pr-3">MP habilitado</th>
                <th className="text-left py-2">Semáforo</th>
              </tr>
            </thead>
            <tbody>
              {datos.tokens.map((t) => (
                <tr key={t.id_usuario} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="py-2 pr-3 font-mono text-slate-300">
                    {t.id_usuario.slice(0, 8)}…
                  </td>
                  <td className="py-2 pr-3 font-mono text-cyan-300">{t.mp_user_id ?? '—'}</td>
                  <td className="py-2 pr-3">
                    {t.token_valido === null ? (
                      <span className="text-slate-500">desconocido</span>
                    ) : t.token_valido ? (
                      <Chip tono="emerald">sí</Chip>
                    ) : (
                      <Chip tono="red">no</Chip>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-slate-300">{fmtFecha(t.mp_token_expires_at)}</td>
                  <td className="py-2 pr-3 text-slate-400 max-w-[12rem] truncate">
                    {t.mp_scopes ?? '—'}
                  </td>
                  <td className="py-2 pr-3 text-red-300 max-w-[12rem] truncate">
                    {t.ultimo_error_token ?? '—'}
                  </td>
                  <td className="py-2 pr-3">
                    {t.marketplace_habilitado ? (
                      <Chip tono="cyan">sí</Chip>
                    ) : (
                      <span className="text-slate-500">no</span>
                    )}
                  </td>
                  <td className="py-2">
                    <Semaforo valor={t.semaforo} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function ButtonCsv({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ml-auto inline-flex items-center text-xs text-slate-300 hover:text-white"
    >
      <Download className="w-3.5 h-3.5 mr-1" />
      CSV
    </button>
  );
}
