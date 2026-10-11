'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Settings, Zap, Percent, Save, Loader2 } from 'lucide-react';

type RespuestaApi<T> = T & { data?: T };
type ErrorApi = { response?: { data?: { message?: string } } };

const mensajeDeError = (error: unknown, fallback: string): string =>
  (error as ErrorApi | undefined)?.response?.data?.message || fallback;

interface ConfigItem {
  clave: string;
  valor: string;
  tipo_dato?: string;
  descripcion?: string;
}

export default function AdminConfiguracionPage() {
  const user = useAuthStore((s) => s.user);
  const [configs, setConfigs] = useState<Record<string, ConfigItem>>({});
  const [montoExpress, setMontoExpress] = useState('');
  const [comision, setComision] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const fetchConfigs = useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.get<RespuestaApi<ConfigItem[]>>('/configuracion');
      const data = extractData<RespuestaApi<ConfigItem[]> | null>(res);
      const items = data?.data || data || [];
      const map: Record<string, ConfigItem> = {};
      for (const c of Array.isArray(items) ? items : []) map[c.clave] = c;
      setConfigs(map);
      setMontoExpress(map.MONTO_MAXIMO_SERVICIO_RAPIDO?.valor || '');
      setComision(map.COMISION_PORCENTAJE_APP?.valor || '');
    } catch {
      setConfigs({});
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const guardar = async (clave: string, valor: string) => {
    setGuardando(clave);
    setMsg(null);
    try {
      await api.post('/configuracion', {
        clave,
        valor,
        tipo_dato: 'decimal',
        id_usuario_modifico: user?.id_usuario,
      });
      setConfigs((prev) => ({
        ...prev,
        [clave]: { ...prev[clave], clave, valor, tipo_dato: 'decimal' },
      }));
      setMsg({ tipo: 'ok', texto: `"${clave}" actualizada a ${valor}` });
    } catch (e) {
      setMsg({ tipo: 'error', texto: mensajeDeError(e, 'Error al guardar la configuración') });
    } finally {
      setGuardando(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-7 h-7 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Configuración del Sistema</h1>
          <p className="text-sm text-slate-400">
            Parámetros globales de la plataforma (solo Super Admin)
          </p>
        </div>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-lg text-sm ${
          msg.tipo === 'ok' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {msg.texto}
        </div>
      )}

      {cargando ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Cargando configuración…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-semibold text-white">Límite de Servicios Express</h2>
              </div>
              <p className="text-sm text-slate-400">
                Monto máximo (ARS) para clasificar un servicio como <strong className="text-white">Rápido</strong> (2 clics).
                Supera este monto → Servicio Max (contrato PDF + firma digital).
              </p>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-slate-400 mb-1">Monto máximo (ARS)</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={montoExpress}
                    onChange={(e) => setMontoExpress(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <button
                  onClick={() => guardar('MONTO_MAXIMO_SERVICIO_RAPIDO', montoExpress)}
                  disabled={guardando !== null || !montoExpress || Number(montoExpress) <= 0}
                  className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {guardando === 'MONTO_MAXIMO_SERVICIO_RAPIDO' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Actual: ${configs.MONTO_MAXIMO_SERVICIO_RAPIDO?.valor || '—'} · {configs.MONTO_MAXIMO_SERVICIO_RAPIDO?.descripcion}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">Comisión de la Plataforma</h2>
              </div>
              <p className="text-sm text-slate-400">
                Porcentaje de comisión que retiene la plataforma al proveedor por cada transacción completada.
              </p>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-slate-400 mb-1">Porcentaje (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={comision}
                    onChange={(e) => setComision(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <button
                  onClick={() => guardar('COMISION_PORCENTAJE_APP', comision)}
                  disabled={guardando !== null || !comision || Number(comision) < 0 || Number(comision) > 100}
                  className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {guardando === 'COMISION_PORCENTAJE_APP' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Actual: {configs.COMISION_PORCENTAJE_APP?.valor}% · {configs.COMISION_PORCENTAJE_APP?.descripcion}
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
