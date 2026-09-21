'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Bot, User, Send, X, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Mensaje {
  id: number;
  remitente: 'usuario' | 'bot';
  contenido: string;
  fecha: Date;
}

const RESPUESTAS_PREDEFINIDAS: Record<string, string> = {
  registro: 'Para registrarte, ingresá a /auth/register y completá el formulario con tus datos. Podés registrarte como cliente o proveedor.',
  pago: 'Los pagos se realizan de forma segura a través de Mercado Pago. Una vez aceptado el servicio, se genera una transacción.',
  reclamo: 'Para abrir un reclamo, andá a tu dashboard > Reclamos > Nuevo Reclamo. Necesitás tener una transacción asociada.',
  valoracion: 'Las valoraciones se realizan después de completar una transacción. Podés puntuar del 1 al 5 y dejar un comentario.',
  servicio: 'Para buscar un servicio, utilizá la barra de búsqueda en /servicios o filtrá por categoría.',
  proveedor: 'Para ofrecer tus servicios, registrate como proveedor y completá tu perfil en /dashboard/mis-servicios.',
  mediacion: 'Si no podés resolver un reclamo, podés solicitar mediación desde el detalle del reclamo.',
  default: 'No estoy seguro de poder ayudarte con eso. Te derivó con nuestro equipo de soporte. Podés abrir un ticket desde /dashboard/tickets.',
};

function obtenerRespuesta(pregunta: string): string {
  const lower = pregunta.toLowerCase();
  if (lower.includes('registr') || lower.includes('cuenta')) return RESPUESTAS_PREDEFINIDAS.registro;
  if (lower.includes('pag') || lower.includes('cobr') || lower.includes('mercadopago')) return RESPUESTAS_PREDEFINIDAS.pago;
  if (lower.includes('reclamo') || lower.includes('queja') || lower.includes('problema')) return RESPUESTAS_PREDEFINIDAS.reclamo;
  if (lower.includes('valor') || lower.includes('opini') || lower.includes('calific')) return RESPUESTAS_PREDEFINIDAS.valoracion;
  if (lower.includes('servicio') || lower.includes('buscar') || lower.includes('contratar')) return RESPUESTAS_PREDEFINIDAS.servicio;
  if (lower.includes('proveedor') || lower.includes('ofrecer')) return RESPUESTAS_PREDEFINIDAS.proveedor;
  if (lower.includes('mediacion') || lower.includes('disputa')) return RESPUESTAS_PREDEFINIDAS.mediacion;
  return RESPUESTAS_PREDEFINIDAS.default;
}

export default function Chatbot() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { id: 1, remitente: 'bot', contenido: '¡Hola! Soy el asistente de Contrato Directo. ¿En qué puedo ayudarte?', fecha: new Date() },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes]);

  const enviarMensaje = () => {
    if (!input.trim()) return;
    const usuarioMsg: Mensaje = { id: Date.now(), remitente: 'usuario', contenido: input.trim(), fecha: new Date() };
    setMensajes((prev) => [...prev, usuarioMsg]);
    setInput('');
    setTimeout(() => {
      const respuesta = obtenerRespuesta(usuarioMsg.contenido);
      const botMsg: Mensaje = { id: Date.now() + 1, remitente: 'bot', contenido: respuesta, fecha: new Date() };
      setMensajes((prev) => [...prev, botMsg]);
    }, 500);
  };

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96">
      <Card className="overflow-hidden shadow-2xl">
        <div className="p-3 bg-cyan-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-white" />
            <span className="text-white font-medium text-sm">Asistente Virtual</span>
          </div>
          <button onClick={() => setAbierto(false)} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div ref={scrollRef} className="h-72 overflow-y-auto p-3 space-y-3">
          {mensajes.map((m) => (
            <div key={m.id} className={cn('flex gap-2', m.remitente === 'usuario' ? 'justify-end' : 'justify-start')}>
              {m.remitente === 'bot' && <Bot className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />}
              <div
                className={cn(
                  'max-w-[75%] px-3 py-2 rounded-xl text-sm',
                  m.remitente === 'usuario'
                    ? 'bg-cyan-600 text-white rounded-tr-none'
                    : 'bg-slate-700 text-slate-200 rounded-tl-none'
                )}
              >
                {m.contenido}
              </div>
              {m.remitente === 'usuario' && <User className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />}
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-slate-700">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviarMensaje();
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí tu pregunta..."
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
