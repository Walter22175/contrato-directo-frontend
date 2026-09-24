'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { extractData } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, Star, Clock, Shield, MessageSquare, ArrowLeft } from 'lucide-react';
import type { Transaccion } from '@/types';

export function CheckoutExitoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idTransaccion = searchParams.get('id_transaccion');
  const tiempoStr = searchParams.get('tiempo');

  const [transaccion, setTransaccion] = useState<Transaccion | null>(null);
  const [loading, setLoading] = useState(true);
  const [susEnviado, setSusEnviado] = useState(false);
  const [susScore, setSusScore] = useState<number | null>(null);
  const [susComentario, setSusComentario] = useState('');

  useEffect(() => {
    if (!idTransaccion) {
      router.push('/dashboard/transacciones');
      return;
    }

    const fetchTransaccion = async () => {
      try {
        const res = await api.get(`/transacciones/${idTransaccion}`);
        const data = extractData<any>(res);
        setTransaccion(data);
      } catch {
        router.push('/dashboard/transacciones');
      } finally {
        setLoading(false);
      }
    };
    fetchTransaccion();
  }, [idTransaccion, router]);

  const handleSusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!susScore || !idTransaccion) return;

    try {
      await api.post('/metricas/sus', {
        id_transaccion: idTransaccion,
        sus_score: susScore,
        sus_comentarios: susComentario,
      });
      setSusEnviado(true);
    } catch (e) {
      console.error('Error enviando SUS:', e);
    }
  };

  const tiempoMinutos = tiempoStr ? `${Math.floor(Number(tiempoStr) / 60)}m ${Number(tiempoStr) % 60}s` : 'N/A';

  if (loading) {
const handleSusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!susScore || !idTransaccion) return;

    try {
      await api.post('/metricas/sus', {
        id_transaccion: idTransaccion,
        sus_score: susScore,
        sus_comentarios: susComentario,
      });
      setSusEnviado(true);
    } catch (e) {
      console.error('Error enviando SUS:', e);
    }
  };

  return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full text-cyan-500" />
        </main>
      </div>
    );
  }

  if (!transaccion) return null;

  const comision = transaccion.comision_monto || (transaccion.monto_acordado * transaccion.comision_porcentaje / 100);
  const total = transaccion.monto_acordado + comision;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Header />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Success Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">¡Pago Confirmado!</h1>
            <p className="text-slate-400 text-lg">Tu transacción se ha procesado correctamente</p>
          </div>

          {/* Transaccion Details */}
          <Card className="mb-6">
            <CardTitle>Detalle de la Transacción</CardTitle>
            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🔧</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{transaccion.servicio?.nombre || 'Servicio'}</h3>
                  <p className="text-sm text-slate-400">{transaccion.proveedor?.nombre} {transaccion.proveedor?.apellido}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                    <span>{transaccion.servicio?.categoria?.nombre || 'Servicio'}</span>
                    <span>ID: {idTransaccion?.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                <div>
                  <p className="text-xs text-slate-500">Monto Servicio</p>
                  <p className="font-semibold text-white">{formatCurrency(transaccion.monto_acordado)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Comisión (8%)</p>
                  <p className="font-semibold text-white">{formatCurrency(transaccion.comision_monto || (transaccion.monto_acordado * 0.08))}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Tiempo de pago</p>
                  <p className="font-semibold text-white">{tiempoMinutos}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Pagado</p>
                  <p className="font-bold text-cyan-400 text-lg">{formatCurrency(transaccion.monto_acordado + (transaccion.comision_monto || transaccion.monto_acordado * 0.08))}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Status & Security */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-green-500/10 border-green-500/20">
              <div className="flex items-center gap-3 p-4">
                <Shield className="w-6 h-6 text-green-500" />
                <div>
                  <p className="text-xs text-slate-500">Pago Seguro</p>
                  <p className="font-semibold text-white">PCI DSS Compliant</p>
                </div>
              </div>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/20">
              <div className="flex items-center gap-3 p-4">
                <Clock className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="text-xs text-slate-500">Pago en Custodia</p>
                  <p className="font-semibold text-white">Liberación tras conformidad</p>
                </div>
              </div>
            </Card>
            <Card className="bg-cyan-500/10 border-cyan-500/20">
              <div className="flex items-center gap-3 p-4">
                <MessageSquare className="w-6 h-6 text-cyan-500" />
                <div>
                  <p className="text-xs text-slate-500">Soporte 24/7</p>
                  <p className="font-semibold text-white">Centro de ayuda disponible</p>
                </div>
              </div>
            </Card>
          </div>

          {/* SUS Survey */}
          {!susEnviado && (
            <Card className="mb-6 bg-cyan-500/5 border-cyan-500/20">
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                ¡Tu opinión nos importa! (SUS)
              </CardTitle>
              <p className="text-slate-400 text-sm mt-2 mb-6">
                Calificá tu experiencia de pago (escala 0-100). Nos ayuda a mejorar.
              </p>
              <form onSubmit={handleSusSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Puntuación SUS: <span className="text-cyan-400 font-bold">{susScore || 0}</span>/100
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={susScore || 50}
                    onChange={(e) => setSusScore(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>0 - Muy difícil</span>
                    <span>50 - Neutral</span>
                    <span>100 - Muy fácil</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Comentario (opcional)
                  </label>
                  <textarea
                    value={susComentario}
                    onChange={(e) => setSusComentario(e.target.value)}
                    rows={3}
                    placeholder="¿Qué te gustó? ¿Qué mejoraríamos?"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  Enviar Encuesta
                </Button>
              </form>
            </Card>
          )}

          {susEnviado && (
            <Card className="mb-6 bg-green-500/10 border-green-500/20">
              <div className="flex items-center gap-3 p-4">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-semibold text-white">¡Gracias por tu feedback!</p>
                  <p className="text-sm text-slate-400">Tu puntuación SUS: {susScore}/100</p>
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => router.push(`/servicios/${transaccion.id_servicio}`)}
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Servicio
            </Button>
            <Button
              onClick={() => router.push('/dashboard/transacciones')}
              className="flex-1"
            >
              Ver Mis Transacciones
            </Button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              ¿Necesitás ayuda?{' '}
              <a href="/ayuda" className="text-cyan-400 hover:underline">Centro de Ayuda</a>
              {' '}·{' '}
              <a href="/dashboard/tickets" className="text-cyan-400 hover:underline">Crear Ticket</a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}