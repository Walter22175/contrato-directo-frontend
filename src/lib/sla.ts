import type { SlaNivel, SlaConfig, SlaCanal, SlaTracking } from '@/types';

export const SLA_CONFIGURACIONES: SlaConfig[] = [
  {
    nivel: 'nivel_1',
    nombre: 'Consultas simples',
    descripcion: 'Preguntas sobre uso de la plataforma, registro, búsqueda, etc.',
    tiempo_primera_respuesta_min: 15,
    tiempo_resolucion_min: 60,
    canales_recomendados: ['centro_ayuda', 'whatsapp'],
  },
  {
    nivel: 'nivel_2',
    nombre: 'Consultas complejas',
    descripcion: 'Problemas con pagos, conformidad, valoraciones, perfiles.',
    tiempo_primera_respuesta_min: 30,
    tiempo_resolucion_min: 240,
    canales_recomendados: ['email', 'telefono'],
  },
  {
    nivel: 'nivel_3',
    nombre: 'Reclamos y mediación',
    descripcion: 'Disputas entre clientes y proveedores, incumplimientos.',
    tiempo_primera_respuesta_min: 120,
    tiempo_resolucion_min: 2400,
    canales_recomendados: ['telefono', 'email'],
  },
  {
    nivel: 'nivel_4',
    nombre: 'Emergencias',
    descripcion: 'Problemas críticos (fraude, seguridad, caída del sistema).',
    tiempo_primera_respuesta_min: 15,
    tiempo_resolucion_min: 240,
    canales_recomendados: ['telefono', 'email'],
  },
  {
    nivel: 'nivel_5',
    nombre: 'Sugerencias y feedback',
    descripcion: 'Comentarios, sugerencias de mejora, propuestas.',
    tiempo_primera_respuesta_min: 1440,
    tiempo_resolucion_min: 2400,
    canales_recomendados: ['email', 'formulario'],
  },
];

export function obtenerConfigSla(nivel: SlaNivel): SlaConfig {
  return SLA_CONFIGURACIONES.find((c) => c.nivel === nivel) || SLA_CONFIGURACIONES[0];
}

export function calcularTiempoRestanteMin(fechaLimite: string): number {
  const ahora = new Date();
  const limite = new Date(fechaLimite);
  const diff = limite.getTime() - ahora.getTime();
  return Math.max(0, Math.floor(diff / 60000));
}

export function estaDentroDeSla(tracking: SlaTracking): boolean {
  const ahora = new Date();
  if (tracking.estado_sla === 'vencido') return false;
  if (tracking.fecha_primera_respuesta) {
    const limite = new Date(tracking.tiempo_limite_primera_respuesta);
    return new Date(tracking.fecha_primera_respuesta) <= limite;
  }
  return ahora <= new Date(tracking.tiempo_limite_primera_respuesta);
}

export function calcularEstadoSla(tracking: SlaTracking): SlaTracking['estado_sla'] {
  if (tracking.fecha_resolucion) {
    const limiteRes = new Date(tracking.tiempo_limite_resolucion);
    return new Date(tracking.fecha_resolucion) <= limiteRes ? 'cumplido' : 'vencido';
  }
  if (tracking.fecha_primera_respuesta) {
    const limitePrimera = new Date(tracking.tiempo_limite_primera_respuesta);
    if (new Date(tracking.fecha_primera_respuesta) > limitePrimera) return 'vencido';
  }
  const ahora = new Date();
  const limitePrimera = new Date(tracking.tiempo_limite_primera_respuesta);
  if (ahora > limitePrimera && !tracking.fecha_primera_respuesta) return 'vencido';
  const limiteRes = new Date(tracking.tiempo_limite_resolucion);
  if (ahora > limiteRes) return 'vencido';
  const mitad = (limitePrimera.getTime() - new Date(tracking.fecha_creacion).getTime()) / 2;
  if (ahora.getTime() - new Date(tracking.fecha_creacion).getTime() > mitad && !tracking.fecha_primera_respuesta) return 'en_riesgo';
  return 'pendiente';
}

export function formatearTiempoRestante(minutos: number): string {
  if (minutos <= 0) return 'Vencido';
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  if (horas > 24) {
    const dias = Math.floor(horas / 24);
    const horasRest = horas % 24;
    return `${dias}d ${horasRest}h`;
  }
  if (horas > 0) return `${horas}h ${mins}m`;
  return `${mins}m`;
}

export function obtenerCanalRecomendado(nivel: SlaNivel): SlaCanal {
  const config = obtenerConfigSla(nivel);
  return config.canales_recomendados[0];
}
