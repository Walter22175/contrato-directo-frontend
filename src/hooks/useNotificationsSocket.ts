'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

interface NotificationEvent {
  id_usuario: string;
  tipo: string;
  evento: string;
  titulo: string;
  mensaje: string;
  fecha: string;
  [key: string]: unknown;
}

interface TicketActualizadoData {
  estado?: string;
}

interface NuevoMensajeData {
  contenido?: string;
}

interface CambioEstadoData {
  tipo?: string;
  estado?: string;
}

interface SlaAlertaData {
  tipo?: string;
  id_ticket?: string | number;
}

type NotificationHandler = (event: NotificationEvent) => void;

export function useNotificationsSocket(onNotification?: NotificationHandler) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const idUsuario = user?.id_usuario;

  const connect = useCallback(async () => {
    if (!isAuthenticated || !idUsuario) return;

    try {
      const { io } = await import('socket.io-client');
      const socket = io(`${WS_URL}/notifications`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      });

      socket.on('connect', () => {
        setIsConnected(true);
        socket.emit('registrar_usuario', { id_usuario: idUsuario });
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('nueva_notificacion', (data: NotificationEvent) => {
        onNotification?.(data);
      });

      socket.on('ticket_actualizado', (data: TicketActualizadoData) => {
        onNotification?.({
          id_usuario: idUsuario,
          tipo: 'actividad',
          evento: 'ticket_actualizado',
          titulo: 'Ticket actualizado',
          mensaje: `Tu ticket fue actualizado a estado: ${data.estado}`,
          fecha: new Date().toISOString(),
          ...data,
        });
      });

      socket.on('nuevo_mensaje', (data: NuevoMensajeData) => {
        onNotification?.({
          id_usuario: idUsuario,
          tipo: 'actividad',
          evento: 'nuevo_mensaje',
          titulo: 'Nuevo mensaje',
          mensaje: data.contenido?.substring(0, 100) || 'Has recibido un mensaje',
          fecha: new Date().toISOString(),
          ...data,
        });
      });

      socket.on('cambio_estado', (data: CambioEstadoData) => {
        onNotification?.({
          id_usuario: idUsuario,
          tipo: 'actividad',
          evento: 'cambio_estado',
          titulo: 'Cambio de estado',
          mensaje: `${data.tipo} cambió a estado: ${data.estado}`,
          fecha: new Date().toISOString(),
          ...data,
        });
      });

      socket.on('sla_alerta', (data: SlaAlertaData) => {
        onNotification?.({
          id_usuario: idUsuario,
          tipo: 'transaccional',
          evento: 'sla_alerta',
          titulo: 'Alerta SLA',
          mensaje: `SLA ${data.tipo} para ticket ${data.id_ticket}`,
          fecha: new Date().toISOString(),
          ...data,
        });
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }, [isAuthenticated, idUsuario, onNotification]);

  useEffect(() => {
    connect();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [connect]);

  return { isConnected };
}
