'use client';

import { useEffect, useState } from 'react';
import { useUiStore } from '@/store/ui';

export default function BlacklightOverlay() {
  const blacklight = useUiStore((s) => s.blacklight);
  const setBlacklight = useUiStore((s) => s.setBlacklight);
  const [montado, setMontado] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState(false);

  useEffect(() => {
    setMontado(true);
    setBlacklight(localStorage.getItem('blacklight') === '1');
  }, [setBlacklight]);

  useEffect(() => {
    if (!montado) return;
    localStorage.setItem('blacklight', blacklight ? '1' : '0');
    if (blacklight) {
      setFiltroActivo(true);
      return;
    }
    const t = setTimeout(() => setFiltroActivo(false), 500);
    return () => clearTimeout(t);
  }, [blacklight, montado]);

  if (!montado) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{
        backdropFilter: filtroActivo ? 'invert(1) hue-rotate(180deg)' : 'none',
        WebkitBackdropFilter: filtroActivo ? 'invert(1) hue-rotate(180deg)' : 'none',
        opacity: blacklight ? 1 : 0,
        transition: 'opacity 500ms ease',
      }}
    />
  );
}
