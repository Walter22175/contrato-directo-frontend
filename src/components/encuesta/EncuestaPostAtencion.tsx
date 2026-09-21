'use client';

import { useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Star, X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface EncuestaPostAtencionProps {
  idTicket: string;
  tipo?: 'post_ticket' | 'post_reclamo' | 'post_mediacion';
  onClose?: () => void;
}

export default function EncuestaPostAtencion({ idTicket, tipo = 'post_ticket', onClose }: EncuestaPostAtencionProps) {
  const { user } = useAuthStore();
  const [puntuacion, setPuntuacion] = useState(0);
  const [hoverEstrella, setHoverEstrella] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const enviarEncuesta = async () => {
    if (puntuacion === 0) return;
    setEnviando(true);
    try {
      await api.post('/encuestas', {
        id_ticket: idTicket,
        id_usuario: user?.id_usuario,
        puntuacion,
        comentario: comentario.trim() || undefined,
        tipo,
      });
      setEnviado(true);
    } catch {
      setEnviado(true);
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Star className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">¡Gracias por tu feedback!</h3>
          <p className="text-sm text-slate-400">Tu opinión nos ayuda a mejorar.</p>
          {onClose && (
            <button onClick={onClose} className="mt-4 text-sm text-cyan-400 hover:text-cyan-300">
              Cerrar
            </button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <CardTitle>¿Cómo fue tu experiencia?</CardTitle>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((estrella) => (
            <button
              key={estrella}
              onMouseEnter={() => setHoverEstrella(estrella)}
              onMouseLeave={() => setHoverEstrella(0)}
              onClick={() => setPuntuacion(estrella)}
              className="p-0.5 transition-colors"
            >
              <Star
                className={cn(
                  'w-8 h-8 transition-colors',
                  estrella <= (hoverEstrella || puntuacion)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-slate-600'
                )}
              />
            </button>
          ))}
          {puntuacion > 0 && (
            <span className="ml-2 text-sm text-slate-400">
              {puntuacion === 1 && 'Muy mala'}
              {puntuacion === 2 && 'Mala'}
              {puntuacion === 3 && 'Regular'}
              {puntuacion === 4 && 'Buena'}
              {puntuacion === 5 && 'Excelente'}
            </span>
          )}
        </div>

        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Contanos más (opcional)..."
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none mb-4"
          rows={3}
        />

        <button
          onClick={enviarEncuesta}
          disabled={puntuacion === 0 || enviando}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" /> {enviando ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </Card>
  );
}
