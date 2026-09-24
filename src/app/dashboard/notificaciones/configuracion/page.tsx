'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { extractData } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Bell, Mail, Smartphone, Save, Check } from 'lucide-react';
import type { PreferenciaNotificacion } from '@/types';

const TIPOS_NOTIFICACION = [
  { key: 'transaccional', label: 'Transaccionales', description: 'Pagos, reclamos, contratos, conformidades', icon: '💳', disabled: true, defaultEnabled: true },
  { key: 'actividad', label: 'Actividad', description: 'Solicitudes, valoraciones, mensajes, ofertas', icon: '🔔', disabled: false, defaultEnabled: true },
  { key: 'plataforma', label: 'Plataforma', description: 'Boletines, promociones, novedades', icon: '📰', disabled: false, defaultEnabled: true },
];

const CANALES = [
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'push', label: 'Push', icon: Smartphone },
  { key: 'plataforma', label: 'Plataforma', icon: Bell },
];

const FRECUENCIAS = [
  { key: 'diario', label: 'Diario' },
  { key: 'semanal', label: 'Semanal' },
  { key: 'sin_resumen', label: 'Sin resumen' },
];

export default function NotificacionesConfigPage() {
  const user = useAuthStore((s) => s.user);
  const [preferencias, setPreferencias] = useState<PreferenciaNotificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [frecuencia, setFrecuencia] = useState('diario');

  useEffect(() => {
    const fetchPreferencias = async () => {
      try {
        const res = await api.get('/notificaciones/preferencias');
        const data = extractData<PreferenciaNotificacion[]>(res);
        setPreferencias(Array.isArray(data) ? data : []);
        if (data?.length > 0) {
          const freq = data.find((p) => p.frecuencia_resumen);
          if (freq) setFrecuencia(freq.frecuencia_resumen);
        }
      } catch {
        setPreferencias([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPreferencias();
  }, []);

  const getPreferencia = (tipo: string, canal: string) => {
    return preferencias.find((p) => p.tipo_notificacion === tipo && p.canal_preferido === canal);
  };

  const getDefaultEnabled = (tipo: string) => {
    const tipoConfig = TIPOS_NOTIFICACION.find(t => t.key === tipo);
    return tipoConfig?.defaultEnabled ?? false;
  };

  const togglePreferencia = async (tipo: string, canal: string, currentValue: boolean) => {
    if (!user?.id_usuario) return;

    const existing = getPreferencia(tipo, canal);

    if (existing) {
      try {
        await api.patch(`/notificaciones/preferencias/${existing.id_preferencia}`, {
          habilitada: !currentValue,
        });
        setPreferencias((prev) =>
          prev.map((p) =>
            p.id_preferencia === existing.id_preferencia
              ? { ...p, habilitada: !currentValue }
              : p
          )
        );
      } catch {}
    } else {
      try {
        const res = await api.post('/notificaciones/preferencias', {
          id_usuario: user.id_usuario,
          tipo_notificacion: tipo,
          canal_preferido: canal,
          habilitada: !currentValue,
          frecuencia_resumen: frecuencia,
        });
        const newPref = extractData<PreferenciaNotificacion>(res);
        setPreferencias((prev) => [...prev, newPref]);
      } catch {}
    }
  };

  const saveFrecuencia = async () => {
    setSaving(true);
    try {
      for (const pref of preferencias) {
        await api.patch(`/notificaciones/preferencias/${pref.id_preferencia}`, {
          frecuencia_resumen: frecuencia,
        });
      }
      setPreferencias((prev) =>
        prev.map((p) => ({ ...p, frecuencia_resumen: frecuencia }))
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {} finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-3xl mx-auto space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">Configuración de Notificaciones</h1>
          <p className="text-slate-400 mb-8">Elegí cómo y cuándo recibir notificaciones</p>

          {/* Notification types by channel */}
          <div className="space-y-6">
            {TIPOS_NOTIFICACION.map((tipo) => (
              <Card key={tipo.key}>
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">{tipo.icon}</span>
                  <div>
                    <CardTitle>{tipo.label}</CardTitle>
                    <p className="text-sm text-slate-400 mt-1">{tipo.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {CANALES.map((canal) => {
                    const pref = getPreferencia(tipo.key, canal.key);
                    const defaultEnabled = getDefaultEnabled(tipo.key);
                    const enabled = pref ? pref.habilitada : defaultEnabled;
                    const Icon = canal.icon;

                    return (
                      <button
                        key={canal.key}
                        onClick={() => !tipo.disabled && togglePreferencia(tipo.key, canal.key, enabled)}
                        disabled={tipo.disabled}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                          tipo.disabled
                            ? 'border-slate-700 bg-slate-800/50 text-slate-500 cursor-not-allowed'
                            : enabled
                              ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
                              : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{canal.label}</span>
                        {enabled && !tipo.disabled && <Check className="w-4 h-4 ml-auto" />}
                      </button>
                    );
                  })}
                </div>

                {tipo.key === 'transaccional' && (
                  <p className="text-xs text-slate-500 mt-3">
                    Las notificaciones transaccionales son obligatorias y no se pueden desactivar.
                  </p>
                )}
              </Card>
            ))}
          </div>

          {/* Email frequency */}
          <Card className="mt-6">
            <CardTitle>Frecuencia de resumen por email</CardTitle>
            <p className="text-sm text-slate-400 mt-1 mb-4">Recibí un resumen de actividad periódicamente</p>
            <div className="flex gap-3">
              {FRECUENCIAS.map((freq) => (
                <button
                  key={freq.key}
                  onClick={() => setFrecuencia(freq.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    frecuencia === freq.key
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                  }`}
                >
                  {freq.label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={saveFrecuencia} disabled={saving}>
                {saved ? (
                  <><Check className="w-4 h-4 mr-2" /> Guardado</>
                ) : saving ? (
                  'Guardando...'
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Guardar frecuencia</>
                )}
              </Button>
            </div>
          </Card>

          {/* Do Not Disturb */}
          <Card className="mt-6">
            <CardTitle>Horario de no molestar</CardTitle>
            <p className="text-sm text-slate-400 mt-1 mb-4">Configurá un horario para no recibir notificaciones push</p>
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm text-slate-400">Desde</label>
                <input
                  type="time"
                  defaultValue="22:00"
                  className="block mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Hasta</label>
                <input
                  type="time"
                  defaultValue="08:00"
                  className="block mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
