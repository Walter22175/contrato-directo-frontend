'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { extractData } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, Banknote, Shield, AlertCircle, Loader2, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import type { Transaccion } from '@/types';
import { useStepTimer } from '@/hooks/useStepTimer';
import { TimerDisplay, TimerProgress, StepTimerCard } from '@/components/checkout/TimerDisplay';
import { useFunnelAnalytics } from '@/hooks/useFunnelAnalytics';

const mpPublicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || 'TEST-xxxxxxxxxxxxxxxx';

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idTransaccion = searchParams.get('id_transaccion') || searchParams.get('id');

  const [transaccion, setTransaccion] = useState<Transaccion | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metodoPago, setMetodoPago] = useState<'tarjeta' | 'transferencia'>('tarjeta');
  const [mpInstance, setMpInstance] = useState<any>(null);
  const [checkoutRendered, setCheckoutRendered] = useState(false);
  const checkoutContainerRef = useRef<HTMLDivElement>(null);
  
  // Timer automático con tracking de pasos
  const {
    tiempoActual,
    pasoActual,
    corriendo,
    cambiarPaso,
    obtenerTiempoTotal,
    obtenerTiempoPaso,
  } = useStepTimer({
    pasoInicial: 3,
    autoStart: true,
    onPasoChange: async (paso, duracion) => {
      if (idTransaccion) {
        await api.post('/metricas/paso', { id_transaccion: idTransaccion, paso: paso });
        await api.post('/metricas/tiempo', { id_transaccion: idTransaccion, tiempo_total_segundos: duracion });
      }
    },
  });
  
  // Funnel Analytics
  const { trackPasoCompletado, trackAbandono, trackError } = useFunnelAnalytics(idTransaccion);

  useEffect(() => {
    if (!idTransaccion) {
      setError('ID de transacción no encontrado');
      setLoading(false);
      return;
    }

    const fetchTransaccion = async () => {
      try {
        const res = await api.get(`/transacciones/${idTransaccion}`);
        const data = extractData<any>(res);
        setTransaccion(data);
        await api.post('/metricas/paso', { id_transaccion: idTransaccion, paso: 3 });
      } catch (e) {
        setError('Error al cargar la transacción');
      } finally {
        setLoading(false);
      }
    };
    fetchTransaccion();
  }, [idTransaccion]);

  useEffect(() => {
    const loadMercadoPago = async () => {
      if (typeof window !== 'undefined' && !window.MercadoPago) {
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.async = true;
        script.onload = () => {
          if (window.MercadoPago) {
            const mp = new window.MercadoPago(mpPublicKey, { locale: 'es-AR' });
            setMpInstance(mp);
          }
        };
        document.head.appendChild(script);
      } else if (window.MercadoPago) {
        const mp = new window.MercadoPago(mpPublicKey, { locale: 'es-AR' });
        setMpInstance(mp);
      }
    };
    loadMercadoPago();
  }, []);

  useEffect(() => {
    if (mpInstance && checkoutContainerRef.current && !checkoutRendered && transaccion?.estado === 'pendiente') {
      renderCheckout();
    }
  }, [mpInstance, transaccion, checkoutRendered]);

  const renderCheckout = async () => {
    if (!mpInstance || !checkoutContainerRef.current || !transaccion) return;

    try {
      const res = await api.post('/pagos/crear-checkout-mercadopago', { id_transaccion: idTransaccion });
      const data = extractData<any>(res);
      const preferenceId = data?.preference_id || data?.id;

      if (!preferenceId) throw new Error('No se obtuvo preference_id');

      const checkout = mpInstance.checkout({
        preference: { id: preferenceId },
        render: {
          containerId: 'mercadopago-checkout',
          label: 'Pagar',
        },
        autoOpen: true,
      });

      checkout.on('ready', () => {
        setCheckoutRendered(true);
        trackPasoCompletado(3, { evento: 'checkout_rendered', preference_id: preferenceId });
      });

      checkout.on('error', (err: any) => {
        console.error('MP Checkout error:', err);
        trackError(3, err?.message || 'Error en checkout MP', { preference_id: preferenceId });
        setError('Error al cargar el checkout. Intente nuevamente.');
      });

    } catch (e) {
      console.error('Error creando checkout:', e);
      trackError(3, e instanceof Error ? e.message : 'Error desconocido');
      setError('Error al iniciar el pago');
    }
  };

  const handlePagoExitoso = async () => {
    const tiempoTotal = obtenerTiempoTotal();
    try {
      await api.post('/metricas/tiempo', { id_transaccion: idTransaccion, tiempo_total_segundos: tiempoTotal });
      await api.post('/metricas/paso', { id_transaccion: idTransaccion, paso: 4 });
      trackPasoCompletado(4, { evento: 'pago_exitoso', tiempo_total: tiempoTotal });
      router.push(`/checkout/exito?id_transaccion=${idTransaccion}&tiempo=${tiempoTotal}`);
    } catch {
      router.push(`/checkout/exito?id_transaccion=${idTransaccion}`);
    }
  };

  const handlePagoFallido = async () => {
    const tiempoTotal = obtenerTiempoTotal();
    await api.post('/metricas/tiempo', { id_transaccion: idTransaccion, tiempo_total_segundos: tiempoTotal });
    await api.post('/metricas/paso', { id_transaccion: idTransaccion, paso: 4 });
    trackError(4, 'Pago fallido o cancelado por usuario', { tiempo_total: tiempoTotal });
    router.push(`/checkout/fallo?id_transaccion=${idTransaccion}&tiempo=${tiempoTotal}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin text-cyan-500" />
        </main>
      </div>
    );
  }

  if (error && !transaccion) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Error</h2>
              <p className="text-slate-400 mb-6">{error}</p>
              <Button onClick={() => router.back()}>Volver</Button>
            </div>
          </Card>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[
                { label: 'Búsqueda', step: 1, icon: '🔍' },
                { label: 'Selección', step: 2, icon: '👤' },
                { label: 'Pago', step: 3, icon: '💳', active: true },
                { label: 'Confirmación', step: 4, icon: '✅' },
              ].map((s, i) => (
                <div key={s.label} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      i < 2 ? 'bg-cyan-500 text-white' : i === 2 ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-500'
                    }`}>
                      {s.icon}
                    </div>
                    <span className={`hidden sm:block font-medium ${i <= 2 ? 'text-white' : 'text-slate-500'}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < 3 && (
                    <div className={`w-16 h-0.5 mx-2 ${i < 2 ? 'bg-cyan-500' : 'bg-slate-700'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Timer Visual */}
          <StepTimerCard
            tiempoSegundos={tiempoActual}
            pasoActual={pasoActual}
            totalPasos={4}
            titulo="Tiempo en Paso de Pago"
            mostrarProgreso
            className="mb-6"
          />

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Resumen del Pedido */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle>Resumen del Pedido</CardTitle>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    transaccion.estado === 'pendiente' ? 'text-yellow-400 bg-yellow-400/10' :
                    transaccion.estado === 'en_proceso' ? 'text-blue-400 bg-blue-400/10' : 'text-slate-500 bg-slate-700/50'
                  }`}>
                    {transaccion.estado.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🔧</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{transaccion.servicio?.nombre || 'Servicio'}</h3>
                    <p className="text-sm text-slate-400">{transaccion.descripcion || transaccion.servicio?.descripcion || 'Servicio profesional'}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                      <span>{transaccion.servicio?.categoria?.nombre || 'Servicio'}</span>
                      <span>Proveedor: {transaccion.proveedor?.nombre} {transaccion.proveedor?.apellido}</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <CardTitle>Método de Pago</CardTitle>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <button
                    onClick={() => {
                      setMetodoPago('tarjeta');
                      trackPasoCompletado(3, { metodo_pago: 'tarjeta' });
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      metodoPago === 'tarjeta'
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-cyan-400" />
                      <span className="font-medium text-white">Tarjeta Crédito/Débito</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Visa, Mastercard, Amex, Cabal</p>
                  </button>
                  <button
                    onClick={() => {
                      setMetodoPago('transferencia');
                      trackPasoCompletado(3, { metodo_pago: 'transferencia' });
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      metodoPago === 'transferencia'
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Banknote className="w-6 h-6 text-green-400" />
                      <span className="font-medium text-white">Transferencia</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Bancaria (CBU/CVU)</p>
                  </button>
                </div>
              </Card>

              {/* Checkout Container */}
              <Card>
                <CardTitle>Checkout Seguro</CardTitle>
                <div className="mt-4">
                  <Shield className="w-5 h-5 text-green-400 mr-2 inline-block" />
                  <span className="text-sm text-slate-400">Datos protegidos con cifrado PCI DSS - Procesado por Mercado Pago</span>
                </div>

                {metodoPago === 'tarjeta' ? (
                  <div id="mercadopago-checkout" ref={checkoutContainerRef} className="mt-4 min-h-[200px]" />
                ) : (
                  <div className="mt-4 space-y-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <h4 className="font-semibold text-white">Transferencia Bancaria</h4>
                    <p className="text-slate-400 text-sm">
                      Al confirmar, recibirás los datos bancarios (CBU/CVU) para realizar la transferencia.
                      El pago se acredita en 1-24 hs hábiles.
                    </p>
                    <Button
                      onClick={async () => {
                        setProcessing(true);
                        try {
                          trackPasoCompletado(3, { metodo_pago: 'transferencia', evento: 'generar_datos_transferencia' });
                          const res = await api.post('/pagos/crear-checkout-mercadopago', { 
                            id_transaccion: idTransaccion,
                            metodo: 'transferencia'
                          });
                          const data = extractData<any>(res);
                          if (data?.transferencia) {
                            alert(`CBU: ${data.transferencia.cbu}\nAlias: ${data.transferencia.alias}\nMonto: ${formatCurrency(total)}`);
                            handlePagoExitoso();
                          }
                        } catch (e) {
                          trackError(3, e instanceof Error ? e.message : 'Error generando transferencia');
                          setError('Error al generar datos de transferencia');
                        } finally {
                          setProcessing(false);
                        }
                      }}
                      disabled={processing}
                      className="w-full"
                      size="lg"
                    >
                      {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Generar Datos de Transferencia'}
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar - Detalle de Costos */}
            <div>
              <Card className="sticky top-24">
                <CardTitle>Detalle de Costos</CardTitle>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Servicio</span>
                    <span className="text-white">{formatCurrency(transaccion.monto_acordado)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Comisión plataforma (8%)</span>
                    <span className="text-white">{formatCurrency(comision)}</span>
                  </div>
                  <hr className="border-slate-700" />
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-white">Total a Pagar</span>
                    <span className="text-cyan-400">{formatCurrency(total)}</span>
                  </div>
                  <p className="text-xs text-slate-500 text-center">
                    El pago queda en custodia hasta que confirmes la conformidad del servicio.
                  </p>
                </div>

                {transaccion.estado === 'pendiente' && (
                  <Button
                    onClick={() => router.push(`/servicios/${transaccion.id_servicio}`)}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver a Selección
                  </Button>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}