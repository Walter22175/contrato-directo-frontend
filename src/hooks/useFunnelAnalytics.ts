'use client';

import { useCallback } from 'react';
import api from '@/lib/api';

interface FunnelEvent {
  paso: number;
  evento: 'inicio' | 'completado' | 'abandono' | 'error';
  id_transaccion: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export function useFunnelAnalytics(idTransaccion: string | null) {
  const enviarEvento = useCallback(async (evento: Omit<FunnelEvent, 'timestamp' | 'id_transaccion'>) => {
    if (!idTransaccion) return;

    const eventoCompleto: FunnelEvent = {
      ...evento,
      id_transaccion: idTransaccion,
      timestamp: new Date().toISOString(),
    };

    try {
      await api.post('/metricas/funnel', eventoCompleto);
    } catch (e) {
      console.warn('Error enviando evento de funnel:', e);
    }
  }, [idTransaccion]);

  const trackPasoInicio = useCallback((paso: number, metadata?: Record<string, any>) => {
    enviarEvento({ paso, evento: 'inicio', metadata });
  }, [enviarEvento]);

  const trackPasoCompletado = useCallback((paso: number, metadata?: Record<string, any>) => {
    enviarEvento({ paso, evento: 'completado', metadata });
  }, [enviarEvento]);

  const trackAbandono = useCallback((paso: number, metadata?: Record<string, any>) => {
    enviarEvento({ paso, evento: 'abandono', metadata });
  }, [enviarEvento]);

  const trackError = useCallback((paso: number, error: string, metadata?: Record<string, any>) => {
    enviarEvento({ paso, evento: 'error', metadata: { ...metadata, error } });
  }, [enviarEvento]);

  return {
    trackPasoInicio,
    trackPasoCompletado,
    trackAbandono,
    trackError,
  };
}