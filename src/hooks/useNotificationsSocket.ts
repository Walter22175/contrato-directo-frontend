'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '@/store/auth';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

interface NotificationEvent {
  id_usuario: string;
  tipo: string;
  evento: string;
  titulo: string;
  mensaje: string;
  fecha: string;
  [key: string]: any;
}

type NotificationHandler = (event: NotificationEvent) => void;

export function useNotificationsSocket(onNotification?: NotificationHandler) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const socketRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(async () => {
    if (!isAuthenticated || !user?.id_usuario) return;

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
        socket.emit('registrar_usuario', { id_usuario: user.id_usuario });
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('nueva_notificacion', (data: NotificationEvent) => {
        onNotification?.(data);
      });

      socket.on('ticket_actualizado', (data: any) => {
        onNotification?.({
          id_usuario: user.id_usuario,
          tipo: 'actividad',
          evento: 'ticket_actualizado',
          titulo: 'Ticket actualizado',
          mensaje: `Tu ticket fue actualizado a estado: ${data.estado}`,
          fecha: new Date().toISOString(),
          ...data,
        });
      });

      socket.on('nuevo_mensaje', (data: any) => {
        onNotification?.({
          id_usuario: user.id_usuario,
          tipo: 'actividad',
          evento: 'nuevo_mensaje',
          titulo: 'Nuevo mensaje',
          mensaje: data.contenido?.substring(0, 100) || 'Has recibido un mensaje',
          fecha: new Date().toISOString(),
          ...data,
        });
      });

      socket.on('cambio_estado', (data: any) => {
        onNotification?.({
          id_usuario: user.id_usuario,
          tipo: 'actividad',
          evento: 'cambio_estado',
          titulo: 'Cambio de estado',
          mensaje: `${data.tipo} cambió a estado: ${data.estado}`,
          fecha: new Date().toISOString(),
          ...data,
        });
      });

      socket.on('sla_alerta', (data: any) => {
        onNotification?.({
          id_usuario: user.id_usuario,
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
  }, [isAuthenticated, user?.id_usuario, onNotification]);

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
