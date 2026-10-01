'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { extractData } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { Star, MapPin, Shield, Clock, ArrowLeft, MessageSquare, Loader2, Send, X } from 'lucide-react';
import type { Servicio, ServicioProveedor } from '@/types';

export default function ServicioDetallePage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [proveedores, setProveedores] = useState<ServicioProveedor[]>([]);
  const [loading, setLoading] = useState(true);

  // Oferta de precio (inicio del flujo de contratación con custodia)
  const [mostrarOferta, setMostrarOferta] = useState(false);
  const [proveedorSel, setProveedorSel] = useState<string>('');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorOferta, setErrorOferta] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/servicios/${params.id}`);
        const data = extractData<Servicio | null>(res);
        setServicio(data);
        setProveedores(data?.servicios_proveedor || []);
      } catch {
        setServicio(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const abrirOferta = (idProveedor?: string) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    const prov = idProveedor
      ? proveedores.find((p) => p.id_usuario === idProveedor)
      : proveedores[0];
    setProveedorSel(prov?.id_usuario || '');
    setMonto(prov?.precio_estimado ? String(prov.precio_estimado) : '');
    setDescripcion('');
    setErrorOferta(null);
    setMostrarOferta(true);
  };

  const enviarOferta = async () => {
    const montoNum = parseFloat(monto);
    if (!proveedorSel) {
      setErrorOferta('Seleccioná un proveedor');
      return;
    }
    if (!montoNum || montoNum <= 0) {
      setErrorOferta('Ingresá un monto válido mayor a 0');
      return;
    }
    setEnviando(true);
    setErrorOferta(null);
    try {
      await api.post('/transacciones', {
        id_cliente: user!.id_usuario,
        id_proveedor: proveedorSel,
        id_servicio: Number(params.id),
        monto_acordado: montoNum,
        descripcion: descripcion || undefined,
      });
      router.push('/dashboard/transacciones');
    } catch (e) {
      const err = e as { response?: { data?: { message?: unknown } }; message?: string };
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo enviar la oferta';
      setErrorOferta(Array.isArray(msg) ? msg.join(', ') : String(msg ?? 'No se pudo enviar la oferta'));
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
        </main>
      </div>
    );
  }

  if (!servicio) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Servicio no encontrado</h1>
            <Link href="/servicios">
              <Button>Volver a servicios</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/servicios" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" />
        Volver a servicios
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white">{servicio.nombre}</h1>
                <span className="text-sm text-slate-400 bg-slate-700/50 px-2 py-1 rounded mt-2 inline-block">
                  {servicio.categoria?.nombre || 'Servicio'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-lg font-semibold text-white">4.8</span>
                <span className="text-sm text-slate-400">(12 reseñas)</span>
              </div>
            </div>

            <p className="text-slate-300 mb-6">
              {servicio.descripcion || 'Servicio profesional disponible en la plataforma Contrato Directo.'}
            </p>

            <div className="flex flex-wrap gap-2">
              {servicio.palabras_clave?.map((kw, i) => (
                <span key={i} className="text-xs bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full">
                  {kw}
                </span>
              ))}
            </div>
          </Card>

          {/* Providers */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Proveedores Disponibles ({proveedores.length})
            </h2>
            {proveedores.length === 0 ? (
              <Card>
                <p className="text-slate-400 text-center py-8">
                  No hay proveedores disponibles para este servicio aún.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {proveedores.map((sp) => (
                  <Card key={sp.id_servicio_proveedor} hover className="flex items-center gap-4">
                    <Link href={`/proveedores/${sp.id_usuario}`} className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {sp.proveedor?.nombre?.[0] || 'P'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">
                          {sp.proveedor?.nombre} {sp.proveedor?.apellido}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {sp.descripcion_personalizada || 'Proveedor verificado'}
                        </p>
                      </div>
                      <div className="text-right">
                        {sp.precio_estimado && (
                          <p className="text-lg font-bold text-cyan-400">
                            {formatCurrency(sp.precio_estimado)}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span>4.9</span>
                        </div>
                      </div>
                    </Link>
                    <Button size="sm" onClick={() => abrirOferta(sp.id_usuario)}>
                      Contratar
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <Card className="sticky top-24">
            <CardTitle>Contratar Servicio</CardTitle>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Proveedores disponibles</span>
                <span className="text-white font-medium">{proveedores.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Tiempo de respuesta</span>
                <span className="text-white font-medium">~24h</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Comisión plataforma</span>
                <span className="text-white font-medium">8%</span>
              </div>
              <hr className="border-slate-700" />
              <Button className="w-full" size="lg" onClick={() => abrirOferta()}>
                <MessageSquare className="w-5 h-5 mr-2" />
                Hacer Oferta
              </Button>
              <p className="text-xs text-slate-500 text-center">
                Al enviar la oferta, el proveedor debe aceptarla. Luego pagás con custodia: el dinero se libera recién cuando confirmás la conformidad.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de oferta */}
      {mostrarOferta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <Card className="w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Hacer una oferta</CardTitle>
              <button
                onClick={() => setMostrarOferta(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {proveedores.length > 1 && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Proveedor</label>
                  <select
                    value={proveedorSel}
                    onChange={(e) => {
                      setProveedorSel(e.target.value);
                      const prov = proveedores.find((p) => p.id_usuario === e.target.value);
                      if (prov?.precio_estimado) setMonto(String(prov.precio_estimado));
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {proveedores.map((sp) => (
                      <option key={sp.id_usuario} value={sp.id_usuario}>
                        {sp.proveedor?.nombre} {sp.proveedor?.apellido}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-400 mb-1">Monto acordado ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="Ej: 25000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Descripción del trabajo</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Contale al proveedor qué necesitás..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-xs text-slate-400">
                <Shield className="w-4 h-4 text-green-400 inline mr-1" />
                El pago se retiene en custodia hasta que confirmes la conformidad. La comisión del 8% se deduce del pago al proveedor.
              </div>

              {errorOferta && (
                <p className="text-sm text-red-400">{errorOferta}</p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setMostrarOferta(false)}
                  disabled={enviando}
                >
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={enviarOferta} disabled={enviando}>
                  {enviando ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Enviar Oferta
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}