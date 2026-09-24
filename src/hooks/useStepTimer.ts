'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseStepTimerOptions {
  pasoInicial?: number;
  autoStart?: boolean;
  onPasoChange?: (paso: number, tiempoTranscurrido: number) => void;
}

export function useStepTimer({ pasoInicial = 1, autoStart = true, onPasoChange }: UseStepTimerOptions = {}) {
  const [tiempoActual, setTiempoActual] = useState(0);
  const [pasoActual, setPasoActual] = useState(pasoInicial);
  const [corriendo, setCorriendo] = useState(autoStart);
  const [historialPasos, setHistorialPasos] = useState<Array<{ paso: number; inicio: number; fin?: number; duracion?: number }>>([
    { paso: pasoInicial, inicio: Date.now() }
  ]);

  const tick = useCallback(() => {
    if (corriendo) {
      setTiempoActual(prev => prev + 1);
    }
  }, [corriendo]);

  useEffect(() => {
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  const cambiarPaso = useCallback((nuevoPaso: number) => {
    const ahora = Date.now();
    setHistorialPasos(prev => {
      const nuevaLista = [...prev];
      const ultimo = nuevaLista[nuevaLista.length - 1];
      if (ultimo && !ultimo.fin) {
        ultimo.fin = ahora;
        ultimo.duracion = Math.floor((ahora - ultimo.inicio) / 1000);
        if (onPasoChange && ultimo.duracion) {
          onPasoChange(ultimo.paso, ultimo.duracion);
        }
      }
      nuevaLista.push({ paso: nuevoPaso, inicio: ahora });
      return nuevaLista;
    });
    setPasoActual(nuevoPaso);
  }, [onPasoChange]);

  const pausar = useCallback(() => setCorriendo(false), []);
  const reanudar = useCallback(() => setCorriendo(true), []);
  const reiniciar = useCallback(() => {
    setTiempoActual(0);
    setPasoActual(pasoInicial);
    setCorriendo(autoStart);
    setHistorialPasos([{ paso: pasoInicial, inicio: Date.now() }]);
  }, [pasoInicial, autoStart]);

  const obtenerTiempoPaso = useCallback((paso: number) => {
    const item = historialPasos.find(h => h.paso === paso);
    if (!item) return 0;
    if (item.fin) return item.duracion || 0;
    if (paso === pasoActual && corriendo) {
      return Math.floor((Date.now() - item.inicio) / 1000);
    }
    return item.duracion || 0;
  }, [historialPasos, pasoActual, corriendo]);

  const obtenerTiempoTotal = useCallback(() => {
    return historialPasos.reduce((total, h) => {
      const duracion = h.duracion || (h.paso === pasoActual && corriendo ? Math.floor((Date.now() - h.inicio) / 1000) : 0);
      return total + (duracion || 0);
    }, 0);
  }, [historialPasos, pasoActual, corriendo]);

  return {
    tiempoActual,
    pasoActual,
    corriendo,
    historialPasos,
    cambiarPaso,
    pausar,
    reanudar,
    reiniciar,
    obtenerTiempoPaso,
    obtenerTiempoTotal,
  };
}

function formatearTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export { formatearTiempo };