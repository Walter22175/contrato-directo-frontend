'use client';

import { useEffect, useRef, useState } from 'react';
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
  const onNotificationRef = useRef(onNotification);
  const [isConnected, setIsConnected] = useState(false);
  const idUsuario = user?.id_usuario;

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!isAuthenticated || !idUsuario) return;

    let active = true;
    let socket: Socket | null = null;

    const connect = async () => {
      try {
        const { io } = await import('socket.io-client');
        if (!active) return;

        socket = io(`${WS_URL}/notifications`, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 10,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          setIsConnected(true);
          socket?.emit('registrar_usuario', { id_usuario: idUsuario });
        });

        socket.on('disconnect', () => {
          setIsConnected(false);
        });

        socket.on('nueva_notificacion', (data: NotificationEvent) => {
          onNotificationRef.current?.(data);
        });

        socket.on('ticket_actualizado', (data: TicketActualizadoData) => {
          onNotificationRef.current?.({
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
          onNotificationRef.current?.({
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
          onNotificationRef.current?.({
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
          onNotificationRef.current?.({
            id_usuario: idUsuario,
            tipo: 'transaccional',
            evento: 'sla_alerta',
            titulo: 'Alerta SLA',
            mensaje: `SLA ${data.tipo} para ticket ${data.id_ticket}`,
            fecha: new Date().toISOString(),
            ...data,
          });
        });
      } catch (error) {
        if (active) console.error('Error connecting to WebSocket:', error);
      }
    };

    void connect();
    return () => {
      active = false;
      socket?.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, idUsuario]);

  return { isConnected };
}
