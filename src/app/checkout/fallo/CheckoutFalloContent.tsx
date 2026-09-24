'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { extractData } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { XCircle, AlertCircle, ArrowLeft, RefreshCw, Shield, HelpCircle, MessageSquare } from 'lucide-react';
import type { Transaccion } from '@/types';
import { useFunnelAnalytics } from '@/hooks/useFunnelAnalytics';

export function CheckoutFalloContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idTransaccion = searchParams.get('id_transaccion');
  const tiempoStr = searchParams.get('tiempo');
  const errorCode = searchParams.get('error') || 'unknown';

  const [transaccion, setTransaccion] = useState<Transaccion | null>(null);
  const [loading, setLoading] = useState(true);
  const [reintentando, setReintentando] = useState(false);

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

  const { trackPasoCompletado, trackError } = useFunnelAnalytics(idTransaccion);

  const handleReintentar = async () => {
    if (!idTransaccion || !transaccion) return;
    setReintentando(true);
    try {
      trackPasoCompletado(3, { evento: 'reintento_desde_fallo', error_code: errorCode });
      router.push(`/checkout?id_transaccion=${idTransaccion}`);
    } catch (e) {
      console.error('Error reintentando:', e);
      trackError(3, e instanceof Error ? e.message : 'Error reintentando');
    } finally {
      setReintentando(false);
    }
  };

  const handleContactarSoporte = () => {
    trackPasoCompletado(3, { evento: 'contactar_soporte', error_code: errorCode });
    router.push(`/dashboard/tickets/nuevo?transaccion=${idTransaccion}`);
  };

  const getErrorMessage = (code: string): { title: string; description: string; solucion: string } => {
    const errores: Record<string, { title: string; description: string; solucion: string }> = {
      'rejected': {
        title: 'Pago Rechazado',
        description: 'El banco o entidad emisora rechazó la transacción.',
        solucion: 'Verificá que tu tarjeta tenga fondos suficientes, no esté vencida y los datos sean correctos. Probá con otra tarjeta o método de pago.',
      },
      'cc_rejected_insufficient_amount': {
        title: 'Fondos Insuficientes',
        description: 'La tarjeta no tiene saldo o límite disponible.',
        solucion: 'Usá otra tarjeta, transferencia bancaria o recargá saldo en tu cuenta.',
      },
      'cc_rejected_high_risk': {
        title: 'Riesgo Alto Detectado',
        description: 'El sistema de prevención de fraude bloqueó la transacción.',
        solucion: 'Contactá a tu banco para autorizar la operación o usá transferencia bancaria.',
      },
      'cc_rejected_bad_filled_date': {
        title: 'Fecha de Vencimiento Incorrecta',
        description: 'La fecha de expiración de la tarjeta es inválida.',
        solucion: 'Verificá la fecha de vencimiento (MM/AA) e intentá nuevamente.',
      },
      'cc_rejected_bad_filled_security_code': {
        title: 'Código de Seguridad Incorrecto',
        description: 'El CVV/CVC ingresado no coincide.',
        solucion: 'Revisá el código de 3-4 dígitos en el reverso de tu tarjeta.',
      },
      'cc_rejected_bad_filled_card_number': {
        title: 'Número de Tarjeta Inválido',
        description: 'El número de tarjeta ingresado es incorrecto.',
        solucion: 'Verificá el número completo de la tarjeta sin espacios ni guiones.',
      },
      'cc_rejected_other_reason': {
        title: 'Error del Banco',
        description: 'El banco rechazó la operación por razones internas.',
        solucion: 'Contactá a tu entidad bancaria o probá con transferencia bancaria.',
      },
      'pending': {
        title: 'Pago Pendiente',
        description: 'La transferencia bancaria está pendiente de acreditación.',
        solucion: 'El pago se acreditará en 1-24 hs hábiles. Recibirás notificación cuando se confirme.',
      },
      'in_process': {
        title: 'Pago en Proceso',
        description: 'La transacción está siendo procesada.',
        solucion: 'Esperá unos minutos y verificá el estado en Mis Transacciones.',
      },
      'default': {
        title: 'Error en el Pago',
        description: `No se pudo completar el pago (código: ${code}).`,
        solucion: 'Intentá nuevamente, verificá tus datos o contactá a soporte.',
      },
    };
    return errores[code] || errores['default'];
  };

  const errorInfo = getErrorMessage(errorCode);
  const tiempoMinutos = tiempoStr ? `${Math.floor(Number(tiempoStr) / 60)}m ${Number(tiempoStr) % 60}s` : 'N/A';

  if (loading) {
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
          {/* Error Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{errorInfo.title}</h1>
            <p className="text-slate-400 text-lg">{errorInfo.description}</p>
          </div>

          {/* Solución */}
          <Card className="mb-6 bg-red-500/10 border-red-500/20">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              ¿Qué podés hacer?
            </CardTitle>
            <p className="text-slate-300 mt-3">{errorInfo.solucion}</p>
          </Card>

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
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                <div>
                  <p className="text-xs text-slate-500">Monto Servicio</p>
                  <p className="font-semibold text-white">{formatCurrency(transaccion.monto_acordado)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="font-bold text-cyan-400 text-lg">{formatCurrency(total)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Tiempo intentado</p>
                  <p className="font-semibold text-white">{tiempoMinutos}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Código de error</p>
                  <p className="font-mono text-sm text-red-400">{errorCode}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Acciones */}
          <div className="space-y-4 mb-6">
            <Button
              onClick={handleReintentar}
              disabled={reintentando}
              className="w-full"
              size="lg"
            >
              {reintentando ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Reintentando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar Pago
                </>
              )}
            </Button>

            <Button
              onClick={handleContactarSoporte}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Contactar Soporte
            </Button>
          </div>

          {/* Alternativas */}
          <Card className="mb-6 bg-cyan-500/5 border-cyan-500/20">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Métodos de Pago Alternativos
            </CardTitle>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-center">
                <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">🏦</span>
                </div>
                <h4 className="font-semibold text-white">Transferencia Bancaria</h4>
                <p className="text-sm text-slate-400 mt-1">CBU/CVU - Acreditación 1-24hs</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-center">
                <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">💳</span>
                </div>
                <h4 className="font-semibold text-white">Otra Tarjeta</h4>
                <p className="text-sm text-slate-400 mt-1">Visa, Mastercard, Amex, Cabal</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center mt-4">
              Al reintentar, podrás seleccionar un método diferente en el checkout.
            </p>
          </Card>

          {/* Seguridad */}
          <Card className="mb-6">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              Tu Seguridad
            </CardTitle>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2"><Shield className="w-4 h-4 text-green-500" /> Tus datos de tarjeta <strong className="text-white">NUNCA</strong> tocan nuestros servidores</li>
              <li className="flex items-center gap-2"><Shield className="w-4 h-4 text-green-500" /> Procesado por <strong className="text-white">Mercado Pago</strong> (PCI DSS Level 1)</li>
              <li className="flex items-center gap-2"><Shield className="w-4 h-4 text-green-500" /> Pago en <strong className="text-white">custodia</strong> hasta conformidad del servicio</li>
            </ul>
          </Card>

          {/* Navegación */}
          <div className="flex flex-col sm:flex-row gap-4">
            {transaccion && (
              <Button
                onClick={() => router.push(`/servicios/${transaccion.id_servicio}`)}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Servicio
              </Button>
            )}
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
              {' '}·{' '}
              <a href="/ayuda/faq" className="text-cyan-400 hover:underline">Preguntas Frecuentes</a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}