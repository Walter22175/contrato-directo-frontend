'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { BookOpen, UserPlus, Search, CreditCard, Star, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Tutorial {
  id: string;
  titulo: string;
  descripcion: string;
  icono: typeof BookOpen;
  pasos: string[];
}

const tutoriales: Tutorial[] = [
  {
    id: 'registro-cliente',
    titulo: 'Cómo registrarse como cliente',
    descripcion: 'Creá tu cuenta en menos de 3 pasos',
    icono: UserPlus,
    pasos: [
      'Hacé clic en "Registrarse" en la página principal',
      'Completá tu email, contraseña y datos personales',
      'Validá tu email y ¡listo! Ya podés buscar servicios',
    ],
  },
  {
    id: 'buscar-servicio',
    titulo: 'Cómo buscar y contratar un servicio',
    descripcion: 'Encontrá el proveedor perfecto para vos',
    icono: Search,
    pasos: [
      'Usá el buscador para encontrar el servicio que necesitá',
      'Filtrá por categoría, valoración o precio',
      'Seleccioná un proveedor y revisá su perfil',
      'Solicitá el servicio y acordá los detalles',
    ],
  },
  {
    id: 'pago',
    titulo: 'Cómo realizar un pago',
    descripcion: 'Pagá de forma segura con Mercado Pago',
    icono: CreditCard,
    pasos: [
      'Confirmá los detalles del servicio contratado',
      'Elegí el medio de pago (tarjeta o transferencia)',
      'El pago queda retenido en custodia hasta la conformidad',
      'Cuando confirmás la conformidad, el pago se libera al proveedor',
    ],
  },
  {
    id: 'valorar',
    titulo: 'Cómo valorar a un proveedor',
    descripcion: 'Dejá tu experiencia para ayudar a otros',
    icono: Star,
    pasos: [
      'Después de un servicio completado, accedé a "Mis Valoraciones"',
      'Seleccioná la transacción que querés valorar',
      'Puntuá del 1 al 5 llaves y dejá un comentario (opcional)',
      'Tu valoración será pública después de moderación',
    ],
  },
  {
    id: 'reclamo',
    titulo: 'Cómo abrir un reclamo',
    descripcion: 'Resolvé conflictos a través del espacio de mediación',
    icono: Shield,
    pasos: [
      'Accedé al espacio de mediación desde tu dashboard',
      'Completá el formulario con los detalles del reclamo',
      'Adjuntá evidencia (fotos, capturas, comprobantes)',
      'El equipo de mediación revisará y emitirá una resolución',
    ],
  },
];

export default function TutorialesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-slate-900/50 border-b border-slate-800 py-8">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
              <Link href="/ayuda" className="hover:text-cyan-400 transition-colors">Ayuda</Link>
              <span>/</span>
              <span className="text-white">Tutoriales</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Tutoriales Paso a Paso</h1>
            <p className="text-slate-400">Aprendé a usar Contrato Directo con nuestras guías</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            {tutoriales.map((t) => {
              const Icon = t.icono;
              return (
                <Card key={t.id}>
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-white mb-1">{t.titulo}</h2>
                        <p className="text-sm text-slate-400 mb-4">{t.descripcion}</p>
                        <ol className="space-y-2">
                          {t.pasos.map((paso, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <span className="w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="text-sm text-slate-300">{paso}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/ayuda/faq"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Ver preguntas frecuentes
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
