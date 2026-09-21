'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface FeedbackArticuloProps {
  idFaq: number;
}

export default function FeedbackArticulo({ idFaq }: FeedbackArticuloProps) {
  const { user } = useAuthStore();
  const [util, setUtil] = useState<boolean | null>(null);
  const [comentario, setComentario] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const enviarFeedback = async () => {
    if (util === null) return;
    setEnviando(true);
    try {
      await api.post('/centro-ayuda/feedback', {
        id_faq: idFaq,
        id_usuario: user?.id_usuario,
        util,
        comentario: comentario.trim() || undefined,
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
      <div className="flex items-center gap-2 text-sm text-green-400 py-2">
        <ThumbsUp className="w-4 h-4" />
        ¡Gracias por tu feedback!
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-700/50">
      <p className="text-xs text-slate-500 mb-2">¿Te fue útil este artículo?</p>
      {util === null ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUtil(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700/50 hover:bg-green-500/10 border border-slate-600 hover:border-green-500/30 rounded-lg text-xs text-slate-400 hover:text-green-400 transition-colors"
          >
            <ThumbsUp className="w-3 h-3" /> Sí
          </button>
          <button
            onClick={() => setUtil(false)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700/50 hover:bg-red-500/10 border border-slate-600 hover:border-red-500/30 rounded-lg text-xs text-slate-400 hover:text-red-400 transition-colors"
          >
            <ThumbsDown className="w-3 h-3" /> No
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Contanos cómo podemos mejorar (opcional)..."
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={enviarFeedback}
              disabled={enviando}
              className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-xs rounded-lg transition-colors"
            >
              <Send className="w-3 h-3" /> {enviando ? 'Enviando...' : 'Enviar'}
            </button>
            <button
              onClick={() => setUtil(null)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
