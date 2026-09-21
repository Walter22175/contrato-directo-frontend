import type { SlaNivel, SlaConfig, SlaCanal, SlaTracking } from '@/types';

const FERIADOS_ARGENTINA_2026 = [
  '2026-01-01', '2026-02-16', '2026-02-17', '2026-03-24',
  '2026-04-02', '2026-04-03', '2026-05-01', '2026-05-25',
  '2026-06-15', '2026-06-20', '2026-07-09', '2026-08-17',
  '2026-10-12', '2026-11-20', '2026-12-08', '2026-12-25',
];

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

export function esDiaHabil(fecha: Date): boolean {
  const dia = fecha.getDay();
  if (dia === 0 || dia === 6) return false;
  const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  return !FERIADOS_ARGENTINA_2026.includes(fechaStr);
}

export function agregarMinutosHabiles(fecha: Date, minutos: number): Date {
  const resultado = new Date(fecha);
  let minutosRestantes = minutos;
  while (minutosRestantes > 0) {
    resultado.setMinutes(resultado.getMinutes() + 1);
    if (esDiaHabil(resultado)) {
      minutosRestantes--;
    }
  }
  return resultado;
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
