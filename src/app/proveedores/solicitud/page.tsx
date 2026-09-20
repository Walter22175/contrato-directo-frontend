'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { FilePlus, ArrowLeft, CheckCircle, Clock, Send } from 'lucide-react';
import Link from 'next/link';

interface Solicitud {
  id_solicitud: number;
  nombre_rubro: string;
  descripcion: string;
  estado: string;
  fecha_solicitud: string;
}

export default function SolicitudRubroPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ nombre_rubro: '', descripcion: '', justificacion: '' });

  const fetchSolicitudes = useCallback(async () => {
    if (!user?.id_usuario) return;
    setLoading(true);
    try {
      const res = await api.get('/solicitud-rubro', { params: { id_solicitante: user.id_usuario } });
      const data = extractData<any>(res);
      setSolicitudes(data?.data || data || []);
    } catch {
      setSolicitudes([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id_usuario]);

  useEffect(() => { fetchSolicitudes(); }, [fetchSolicitudes]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nombre_rubro.trim() || !form.descripcion.trim() || !user?.id_usuario) return;
    setSending(true);
    try {
      await api.post('/solicitud-rubro', {
        ...form,
        id_solicitante: user.id_usuario,
      });
      setForm({ nombre_rubro: '', descripcion: '', justificacion: '' });
      setShowForm(false);
      await fetchSolicitudes();
    } catch {} finally {
      setSending(false);
    }
  };

  const formatearFecha = (f: string) =>
    new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

  const estadoColors: Record<string, string> = {
    pendiente: 'text-yellow-400 bg-yellow-500/10',
    aprobada: 'text-green-400 bg-green-500/10',
    rechazada: 'text-red-400 bg-red-500/10',
    en_evaluacion: 'text-blue-400 bg-blue-500/10',
  };

  const inputCls = 'w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Solicitar Nuevo Rubro</h1>
              <p className="text-slate-400 mt-1">Proponé un nuevo rubro o servicio para el catálogo</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <FilePlus className="w-4 h-4" />
              Nueva Solicitud
            </button>
          </div>

          {showForm && (
            <Card>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Nombre del Rubro</label>
                  <input
                    className={inputCls}
                    placeholder="Ej: Instalación de Paneles Solares"
                    value={form.nombre_rubro}
                    onChange={(e) => setForm({ ...form, nombre_rubro: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Descripción</label>
                  <textarea
                    className={inputCls + ' min-h-[80px] resize-y'}
                    placeholder="Describí el tipo de servicios que incluiría este rubro..."
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Justificación</label>
                  <textarea
                    className={inputCls + ' min-h-[80px] resize-y'}
                    placeholder="¿Por qué debería agregarse este rubro al catálogo?"
                    value={form.justificacion}
                    onChange={(e) => setForm({ ...form, justificacion: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2.5 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Enviando...' : 'Enviar Solicitud'}
                  </button>
                </div>
              </form>
            </Card>
          )}

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-white mb-4">Mis Solicitudes</h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : solicitudes.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <FilePlus className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Aún no enviaste solicitudes de rubro</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {solicitudes.map((s) => (
                  <Card key={s.id_solicitud}>
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-white">{s.nombre_rubro}</h3>
                          <p className="text-sm text-slate-400 mt-1">{s.descripcion}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${estadoColors[s.estado] || 'text-slate-400 bg-slate-500/10'}`}>
                          {s.estado}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">{formatearFecha(s.fecha_solicitud)}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
