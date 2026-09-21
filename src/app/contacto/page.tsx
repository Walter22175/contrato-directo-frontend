'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import IndicadorHorario from '@/components/horarios/IndicadorHorario';
import { Card, CardTitle } from '@/components/ui/Card';
import { MessageSquare, Mail, Phone, HelpCircle, ExternalLink } from 'lucide-react';

const CANALES = [
  {
    nombre: 'Email / Tickets',
    descripcion: 'Sistema de tickets para consultas que no requieren inmediatez.',
    horario: '24/7 (envío). Atención: Lun-Vie 8:00-20:00',
    tiempoRespuesta: 'Primera respuesta < 4h hábiles. Resolución < 24h hábiles.',
    icono: Mail,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    accion: 'Abrir Ticket',
    href: '/dashboard/tickets',
  },
  {
    nombre: 'WhatsApp Business',
    descripcion: 'Atención por mensajería instantánea para consultas rápidas.',
    horario: 'Lun-Vie 9:00-20:00. Sáb 9:00-14:00',
    tiempoRespuesta: 'Primera respuesta < 15 min. Resolución < 1h (simples).',
    icono: MessageSquare,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    accion: 'Enviar WhatsApp',
    href: 'https://wa.me/5491100000000?text=Hola%2C%20necesito%20ayuda%20con%20Contrato%20Directo',
  },
  {
    nombre: 'Teléfono',
    descripcion: 'Línea telefónica para emergencias o casos complejos.',
    horario: 'Lun-Vie 10:00-18:00',
    tiempoRespuesta: 'Atención inmediata. Espera < 5 min.',
    icono: Phone,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    accion: 'Llamar',
    href: 'tel:+5491100000000',
  },
  {
    nombre: 'Centro de Ayuda',
    descripcion: 'Base de conocimientos con FAQs, tutoriales, guías y videos.',
    horario: 'Disponible 24/7 (autogestión)',
    tiempoRespuesta: 'Resolución inmediata.',
    icono: HelpCircle,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    accion: 'Consultar',
    href: '/ayuda',
  },
];

export default function ContactoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-slate-900/50 border-b border-slate-800 py-12">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Contacto</h1>
            <p className="text-slate-400 mb-4">Elegí el canal que mejor se adapte a tu consulta</p>
            <IndicadorHorario className="justify-center" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CANALES.map((canal) => {
              const Icon = canal.icono;
              return (
                <Card key={canal.nombre}>
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${canal.bgColor}`}>
                        <Icon className={`w-5 h-5 ${canal.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{canal.nombre}</h3>
                        <p className="text-sm text-slate-400 mt-0.5">{canal.descripcion}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-slate-500 mb-4">
                      <p><span className="text-slate-400">Horario:</span> {canal.horario}</p>
                      <p><span className="text-slate-400">Tiempo de respuesta:</span> {canal.tiempoRespuesta}</p>
                    </div>
                    <a
                      href={canal.href}
                      target={canal.href.startsWith('http') ? '_blank' : undefined}
                      rel={canal.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {canal.accion}
                      {canal.href.startsWith('http') && <ExternalLink className="w-3 h-3" />}
                    </a>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="mt-8">
            <div className="p-5 text-center">
              <CardTitle>Horarios de Atención</CardTitle>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-left">
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-white font-medium">Horario estándar</p>
                  <p className="text-slate-400">Lunes a viernes de 8:00 a 20:00 (GMT-3)</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-white font-medium">Horario reducido</p>
                  <p className="text-slate-400">Sábados de 9:00 a 13:00 (GMT-3)</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-white font-medium">WhatsApp</p>
                  <p className="text-slate-400">Lun-Vie 9:00-20:00 · Sáb 9:00-14:00</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-white font-medium">Domingos y feriados</p>
                  <p className="text-slate-400">Solo email (24h hábiles) y centro de ayuda</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
