'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { extractData } from '@/lib/api';
import {
  Percent,
  BellRing,
  Hourglass,
  Wallet,
  Eye,
  Link2,
  SlidersHorizontal,
  ShieldCheck,
  Lock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { Faq } from '@/types';

const pasos = [
  {
    icono: BellRing,
    titulo: 'Cliente y proveedor notifican el comienzo',
    texto: 'Cada parte avisa desde la plataforma cuando el trabajo empieza. Es un clic y queda registro para ambos.',
  },
  {
    icono: Hourglass,
    titulo: 'Inicio efectivo = segunda notificación',
    texto: 'El servicio se considera iniciado con la notificación más tardía de las dos: sin ambas confirmaciones, no hay anticipo.',
  },
  {
    icono: Wallet,
    titulo: '72 h después: liberación del 30%',
    texto: 'A las 72 horas calendario desde el inicio efectivo, el 30% del presupuesto se libera al proveedor en horario bancario hábil.',
  },
];

const beneficiosProveedores = [
  {
    icono: Wallet,
    titulo: 'Flujo de caja mejorado',
    texto: 'Cobrás una parte del presupuesto mientras trabajás, sin esperar al final del servicio.',
  },
  {
    icono: Eye,
    titulo: 'Transparencia total',
    texto: 'Cada estado del anticipo queda registrado con fecha y hora, visible para ambas partes.',
  },
  {
    icono: Link2,
    titulo: 'Compatible con hitos y marketplace',
    texto: 'Tus contrataciones por hitos siguen su liberación hito a hito, y podés recibir el cobro por Mercado Pago.',
  },
];

const beneficiosClientes = [
  {
    icono: SlidersHorizontal,
    titulo: 'Control sobre el inicio real',
    texto: 'El servicio solo se inicia cuando ambas partes lo confirman. Si el proveedor notifica sin haber comenzado, podés rechazarlo.',
  },
  {
    icono: Lock,
    titulo: 'El 70% sigue retenido',
    texto: 'El anticipo no afecta tus derechos: el resto del pago permanece en custodia hasta tu conformidad.',
  },
  {
    icono: ShieldCheck,
    titulo: 'Seguridad y trazabilidad',
    texto: 'Nunca se libera dinero de forma unilateral. Toda liberación queda trazada en la transacción.',
  },
];

const FAQ_PALABRAS_CLAVE =
  /anticipo|notificar el inicio|inicio del servicio|horario bancario|liberaci[oó]n anticipada|30%/i;

function filtrarFaqsAnuncio(faqs: Faq[]): Faq[] {
  return faqs
    .filter((f) => FAQ_PALABRAS_CLAVE.test(`${f.pregunta} ${f.respuesta}`))
    .slice(0, 8);
}

export default function Anticipo30Landing() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [cargandoFaqs, setCargandoFaqs] = useState(true);
  const [faqAbierta, setFaqAbierta] = useState<number | null>(null);

  useEffect(() => {
    const cargarFaqs = async () => {
      try {
        const res = await api.get('/centro-ayuda');
        const raw = extractData<Faq[] | { data?: Faq[] }>(res);
        const lista = Array.isArray(raw) ? raw : raw.data || [];
        setFaqs(filtrarFaqsAnuncio(lista));
      } catch {
        setFaqs([]);
      } finally {
        setCargandoFaqs(false);
      }
    };
    cargarFaqs();
  }, []);

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 border-b border-slate-800">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" aria-hidden="true" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full px-3 py-1 mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Novedad
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
                Nuevo anticipo del 30%{' '}
                <span className="text-cyan-400">para servicios largos</span>
              </h1>
              <p className="text-lg text-slate-400 mt-4">
                Más seguridad, más transparencia, mejor flujo de trabajo.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/dashboard/transacciones">
                  <Button size="lg">
                    Ver mis transacciones
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/dashboard/mercado-pago">
                  <Button size="lg" variant="outline">
                    Conectar Mercado Pago
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end" aria-hidden="true">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/25 to-blue-600/25 blur-2xl" />
                <div className="relative w-full h-full rounded-3xl bg-slate-800/80 border border-slate-700 flex items-center justify-center">
                  <Percent className="w-28 h-28 text-cyan-400" />
                </div>
                <span className="absolute -top-3 -left-3 bg-slate-800 border border-cyan-500/30 text-cyan-300 text-sm font-semibold rounded-full px-3 py-1 shadow-lg">
                  +30% anticipado
                </span>
                <span className="absolute -top-3 -right-3 bg-slate-800 border border-slate-600 text-slate-200 text-sm font-semibold rounded-full px-3 py-1 shadow-lg">
                  72 h
                </span>
                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-600 text-slate-200 text-sm font-semibold rounded-full px-3 py-1 shadow-lg">
                  Horario bancario hábil
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center">
          Cómo funciona
        </h2>
        <p className="text-slate-400 text-center mt-2 max-w-2xl mx-auto">
          Tres pasos simples, sin letra chica y con registro para ambas
          partes.
        </p>
        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {pasos.map(({ icono: Icono, titulo, texto }, i) => (
            <Card key={titulo} className="relative">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 shrink-0 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <Icono className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="font-bold text-white">{titulo}</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  {texto}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Beneficios */}
      <section className="bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-white text-center">
            Beneficios
          </h2>
          <div className="grid md:grid-cols-2 gap-8 mt-10">
            <Card>
              <div className="p-6">
                <h3 className="text-xl font-bold text-cyan-400 mb-6">
                  Para proveedores
                </h3>
                <ul className="space-y-5">
                  {beneficiosProveedores.map(({ icono: Icono, titulo, texto }) => (
                    <li key={titulo} className="flex items-start gap-3">
                      <Icono className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-white">{titulo}</p>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          {texto}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <h3 className="text-xl font-bold text-cyan-400 mb-6">
                  Para clientes
                </h3>
                <ul className="space-y-5">
                  {beneficiosClientes.map(({ icono: Icono, titulo, texto }) => (
                    <li key={titulo} className="flex items-start gap-3">
                      <Icono className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-white">{titulo}</p>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          {texto}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center">
          Preguntas frecuentes
        </h2>
        <p className="text-slate-400 text-center mt-2">
          Las mismas respuestas del Centro de Ayuda, acá a un clic.
        </p>
        <div className="mt-8 space-y-3" data-testid="faq-anuncio">
          {cargandoFaqs &&
            [1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          {!cargandoFaqs && faqs.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">
              Visitá el{' '}
              <Link href="/ayuda" className="text-cyan-400 hover:text-cyan-300">
                Centro de Ayuda
              </Link>{' '}
              para ver todas las preguntas sobre pagos y comienzo del
              servicio.
            </p>
          )}
          {!cargandoFaqs &&
            faqs.map((faq) => (
              <Card key={faq.id_faq}>
                <button
                  onClick={() =>
                    setFaqAbierta(faqAbierta === faq.id_faq ? null : faq.id_faq)
                  }
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="font-medium text-white pr-4">
                    {faq.pregunta}
                  </span>
                  {faqAbierta === faq.id_faq ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {faqAbierta === faq.id_faq && (
                  <p className="mt-4 pt-4 border-t border-slate-700/50 text-sm text-slate-300 leading-relaxed">
                    {faq.respuesta}
                  </p>
                )}
              </Card>
            ))}
        </div>
        <p className="text-center text-sm mt-6">
          <Link
            href="/ayuda/comienzo-del-servicio"
            className="text-cyan-400 hover:text-cyan-300"
          >
            Ver la guía completa del comienzo del servicio
          </Link>
        </p>
      </section>

      {/* CTA final */}
      <section className="bg-slate-900/50 border-t border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white">
            ¿Listo para trabajar con ventaja?
          </h2>
          <p className="text-slate-400 mt-2">
            Mirá tus contrataciones o conectá tu cuenta de Mercado Pago para
            recibir el cobro directo.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard/transacciones">
              <Button size="lg">
                Ver mis transacciones
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard/mercado-pago">
              <Button size="lg" variant="outline">
                Conectar Mercado Pago
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
