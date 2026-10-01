'use client';

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
    descripcion: 'Crea tu cuenta en menos de 3 pasos',
    icono: UserPlus,
    pasos: [
      'Haz clic en Registrarse en la página principal',
      'Completa tu email, contraseña y datos personales',
      'Valida tu email y ¡listo! Ya puedes buscar servicios',
    ],
  },
  {
    id: 'buscar-servicio',
    titulo: 'Cómo buscar y contratar un servicio',
    descripcion: 'Encuentra el proveedor perfecto para ti',
    icono: Search,
    pasos: [
      'Usa el buscador para encontrar el servicio que necesitas',
      'Filtra por categoría, valoración o precio',
      'Selecciona un proveedor y revisa su perfil',
      'Solicita el servicio y acuerda los detalles',
    ],
  },
  {
    id: 'pago',
    titulo: 'Cómo realizar un pago',
    descripcion: 'Paga de forma segura con Mercado Pago',
    icono: CreditCard,
    pasos: [
      'Confirma los detalles del servicio contratado',
      'Elige el medio de pago (tarjeta o transferencia)',
      'El pago queda retenido en custodia hasta la conformidad',
      'Cuando confirmas la conformidad, el pago se libera al proveedor',
    ],
  },
  {
    id: 'valorar',
    titulo: 'Cómo valorar a un proveedor',
    descripcion: 'Deja tu experiencia para ayudar a otros',
    icono: Star,
    pasos: [
      'Después de un servicio completado, accede a Mis Valoraciones',
      'Selecciona la transacción que quieres valorar',
      'Puntúa del 1 al 5 llaves y deja un comentario (opcional)',
      'Tu valoración será pública después de moderación',
    ],
  },
  {
    id: 'reclamo',
    titulo: 'Cómo abrir un reclamo',
    descripcion: 'Resuelve conflictos a través del espacio de mediación',
    icono: Shield,
    pasos: [
      'Accede al espacio de mediación desde tu dashboard',
      'Completa el formulario con los detalles del reclamo',
      'Adjunta evidencia (fotos, capturas, comprobantes)',
      'El equipo de mediación revisará y emitirá una resolución',
    ],
  },
];

export default function TutorialesPage() {
  return (
    <main className='flex-1'>
      <div className='bg-slate-900/50 border-b border-slate-800 py-8'>
        <div className='max-w-3xl mx-auto px-4'>
          <div className='flex items-center gap-3 text-sm text-slate-400 mb-4'>
            <Link href='/ayuda' className='hover:text-cyan-400 transition-colors'>Ayuda</Link>
            <span>/</span>
            <span className='text-white'>Tutoriales</span>
          </div>
          <h1 className='text-3xl font-bold text-white mb-2'>Tutoriales Paso a Paso</h1>
          <p className='text-slate-400'>Aprende a usar Contrato Directo con nuestras guías</p>
        </div>
      </div>

      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='space-y-6'>
          {tutoriales.map((t) => {
            const Icon = t.icono;
            return (
              <Card key={t.id}>
                <div className='p-6'>
                  <div className='flex items-start gap-4'>
                    <div className='w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0'>
                      <Icon className='w-6 h-6 text-cyan-400' />
                    </div>
                    <div className='flex-1'>
                      <h2 className='text-lg font-semibold text-white mb-1'>{t.titulo}</h2>
                      <p className='text-sm text-slate-400 mb-4'>{t.descripcion}</p>
                      <ol className='space-y-2'>
                        {t.pasos.map((paso, idx) => (
                          <li key={idx} className='flex items-start gap-3'>
                            <span className='w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5'>
                              {idx + 1}
                            </span>
                            <span className='text-sm text-slate-300'>{paso}</span>
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

        <div className='mt-12 text-center'>
          <Link
            href='/ayuda/faq'
            className='inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors'
          >
            Ver preguntas frecuentes
            <ArrowRight className='w-4 h-4' />
          </Link>
        </div>
      </div>
    </main>
  );
}