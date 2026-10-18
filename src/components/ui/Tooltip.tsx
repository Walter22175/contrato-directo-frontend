'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export const TOOLTIP_COMIENZO =
  'Ambas partes deben notificar. El 30% se libera a las 72 h calendario.';

export default function Tooltip({ texto, children }: { texto: string; children: React.ReactNode }) {
  return (
    <span className="relative inline-flex group items-center">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 max-w-xs rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 shadow-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 z-40"
      >
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        {texto}
      </span>
    </span>
  );
}

export function ChipLanzamiento({ href, texto }: { href: string; texto: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm font-medium hover:bg-cyan-500/20 transition-colors"
    >
      <Sparkles className="w-4 h-4 flex-shrink-0" />
      {texto}
    </Link>
  );
}
