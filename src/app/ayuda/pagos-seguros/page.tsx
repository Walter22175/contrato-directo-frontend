'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { Shield, CheckCircle, ArrowLeft, Clock, RotateCcw, Lock, DollarSign, RefreshCw } from 'lucide-react';

export default function PagosSegurosPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-slate-900/50 border-b border-slate-800 py-8">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
              <Link href="/ayuda" className="hover:text-cyan-400 transition-colors">Ayuda</Link>
              <span>/</span>
              <span className="text-white">Pagos Seguros</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Pagos Seguros</h1>
                <p className="text-slate-400 mt-1">Tu dinero protegido hasta que el servicio se complete</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-8">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Cómo funciona la protección de tu pago</h2>
                <p className="text-slate-300 mb-6">
                  En Contrato Directo utilizamos un sistema de custodia (escrow) que protege tanto a clientes como a proveedores.
                  El dinero no se libera al proveedor hasta que el servicio se completa y vos confirmás la conformidad.
                </p>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Pago en custodia</h3>
                      <p className="text-slate-400 text-sm">Tu pago queda retenido en una cuenta segura de Contrato Directo hasta la conformidad.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Conformidad del cliente</h3>
                      <p className="text-slate-400 text-sm">Solo liberamos el pago cuando vos confirmás que el servicio se realizó correctamente.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Conformidad automática</h3>
                      <p className="text-slate-400 text-sm">Si no respondés en 72h hábiles, se libera automáticamente para no bloquear al proveedor.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Flujo completo del pago</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold">1</div>
                    <div>
                      <h3 className="font-semibold text-white">Acordás el precio</h3>
                      <p className="text-slate-400 text-sm">Negociás el valor del servicio directamente con el proveedor a través de la plataforma.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold">2</div>
                    <div>
                      <h3 className="font-semibold text-white">Pagás con Mercado Pago</h3>
                      <p className="text-slate-400 text-sm">Tarjetas de crédito/débito, transferencias. El pago queda en custodia (8% comisión Contrato Directo).</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold">3</div>
                    <div>
                      <h3 className="font-semibold text-white">El proveedor realiza el servicio</h3>
                      <p className="text-slate-400 text-sm">Dentro del plazo acordado. Podés comunicarte por el chat de la plataforma.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold">4</div>
                    <div>
                      <h3 className="font-semibold text-white">Confirmás la conformidad</h3>
                      <p className="text-slate-400 text-sm">Recibís notificación. Tenés 72h hábiles para confirmar o solicitar correcciones.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold">5</div>
                    <div>
                      <h3 className="font-semibold text-white">Liberación del pago</h3>
                      <p className="text-slate-400 text-sm">En 24h hábiles tras tu conformidad, el proveedor recibe el pago menos la comisión.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Protección adicional</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <RotateCcw className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Reembolsos</h3>
                      <p className="text-slate-400 text-sm">Si el proveedor no cumple, podés solicitar reembolso total o parcial vía mediación (plazo 10 días hábiles).</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Lock className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">PCI DSS</h3>
                      <p className="text-slate-400 text-sm">Procesamiento certificado. Nunca vemos ni guardamos tus datos de tarjeta completa.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Comisión transparente</h3>
                      <p className="text-slate-400 text-sm">Solo 8% sobre el valor del servicio. Visible antes de confirmar la contratación.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <RefreshCw className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Pagos parcelados</h3>
                      <p className="text-slate-400 text-sm">Para proyectos largos: dividís en hitos (máx. 10). Liberación por hito conforme.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="text-center">
              <Link href="/ayuda" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300">
                <ArrowLeft className="w-4 h-4" />
                Volver al Centro de Ayuda
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}