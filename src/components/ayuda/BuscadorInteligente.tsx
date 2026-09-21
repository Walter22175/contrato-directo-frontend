'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Faq } from '@/types';

interface BuscadorInteligenteProps {
  faqs: Faq[];
  onSelect: (faq: Faq) => void;
  className?: string;
}

export default function BuscadorInteligente({ faqs, onSelect, className }: BuscadorInteligenteProps) {
  const [query, setQuery] = useState('');
  const [sugerencias, setSugerencias] = useState<Faq[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSugerencias([]);
      return;
    }
    const lower = query.toLowerCase();
    const filtrados = faqs.filter(
      (f) =>
        f.pregunta.toLowerCase().includes(lower) ||
        f.respuesta.toLowerCase().includes(lower) ||
        f.categoria.toLowerCase().includes(lower)
    ).slice(0, 5);
    setSugerencias(filtrados);
    setIndiceSeleccionado(-1);
  }, [query, faqs]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndiceSeleccionado((prev) => Math.min(prev + 1, sugerencias.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceSeleccionado((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && indiceSeleccionado >= 0) {
      e.preventDefault();
      onSelect(sugerencias[indiceSeleccionado]);
      setMostrarSugerencias(false);
      setQuery('');
    } else if (e.key === 'Escape') {
      setMostrarSugerencias(false);
    }
  };

  const resaltarTexto = (texto: string, busqueda: string) => {
    if (!busqueda.trim()) return texto;
    const regex = new RegExp(`(${busqueda.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const partes = texto.split(regex);
    return partes.map((parte, i) =>
      regex.test(parte) ? (
        <mark key={i} className="bg-cyan-500/30 text-cyan-300 rounded px-0.5">
          {parte}
        </mark>
      ) : (
        parte
      )
    );
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscá preguntas frecuentes..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setMostrarSugerencias(true);
          }}
          onFocus={() => setMostrarSugerencias(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-11 pr-10 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setSugerencias([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {mostrarSugerencias && sugerencias.length > 0 && (
        <div className="absolute z-40 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
          {sugerencias.map((faq, i) => (
            <button
              key={faq.id_faq}
              onClick={() => {
                onSelect(faq);
                setMostrarSugerencias(false);
                setQuery('');
              }}
              className={cn(
                'w-full text-left px-4 py-3 border-b border-slate-700/50 last:border-0 transition-colors',
                i === indiceSeleccionado ? 'bg-cyan-500/10' : 'hover:bg-slate-700/50'
              )}
            >
              <div className="text-xs text-cyan-400 mb-0.5">{faq.categoria}</div>
              <div className="text-sm text-white">{resaltarTexto(faq.pregunta, query)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
