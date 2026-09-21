import type { HorarioAtencion, Feriado } from '@/types';

const HORARIOS_DEFAULT: HorarioAtencion[] = [
  { id_horario: 1, nombre: 'Estándar', dia_semana: [1, 2, 3, 4, 5], hora_inicio: '08:00', hora_fin: '20:00', activo: true },
  { id_horario: 2, nombre: 'Reducido Sábado', dia_semana: [6], hora_inicio: '09:00', hora_fin: '13:00', activo: true },
  { id_horario: 3, nombre: 'WhatsApp', dia_semana: [1, 2, 3, 4, 5], hora_inicio: '09:00', hora_fin: '20:00', activo: true },
  { id_horario: 4, nombre: 'WhatsApp Sábado', dia_semana: [6], hora_inicio: '09:00', hora_fin: '14:00', activo: true },
  { id_horario: 5, nombre: 'Teléfono', dia_semana: [1, 2, 3, 4, 5], hora_inicio: '10:00', hora_fin: '18:00', activo: true },
  { id_horario: 6, nombre: 'Redes Sociales', dia_semana: [1, 2, 3, 4, 5], hora_inicio: '09:00', hora_fin: '18:00', activo: true },
];

const FERIADOS_ARGENTINA_2026: Feriado[] = [
  { id_feriado: 1, fecha: '2026-01-01', nombre: 'Año Nuevo', nacional: true },
  { id_feriado: 2, fecha: '2026-02-16', nombre: 'Carnaval', nacional: true },
  { id_feriado: 3, fecha: '2026-02-17', nombre: 'Carnaval', nacional: true },
  { id_feriado: 4, fecha: '2026-03-24', nombre: 'Día de la Memoria', nacional: true },
  { id_feriado: 5, fecha: '2026-04-02', nombre: 'Día del Veterano', nacional: true },
  { id_feriado: 6, fecha: '2026-04-03', nombre: 'Viernes Santo', nacional: true },
  { id_feriado: 7, fecha: '2026-05-01', nombre: 'Día del Trabajador', nacional: true },
  { id_feriado: 8, fecha: '2026-05-25', nombre: 'Revolución de Mayo', nacional: true },
  { id_feriado: 9, fecha: '2026-06-15', nombre: 'Paso a la Inmortalidad de Güemes', nacional: true },
  { id_feriado: 10, fecha: '2026-06-20', nombre: 'Día de la Bandera', nacional: true },
  { id_feriado: 11, fecha: '2026-07-09', nombre: 'Día de la Independencia', nacional: true },
  { id_feriado: 12, fecha: '2026-08-17', nombre: 'Paso a la Inmortalidad de San Martín', nacional: true },
  { id_feriado: 13, fecha: '2026-10-12', nombre: 'Día del Respeto a la Diversidad Cultural', nacional: true },
  { id_feriado: 14, fecha: '2026-11-20', nombre: 'Día de la Soberanía Nacional', nacional: true },
  { id_feriado: 15, fecha: '2026-12-08', nombre: 'Inmaculada Concepción', nacional: true },
  { id_feriado: 16, fecha: '2026-12-25', nombre: 'Navidad', nacional: true },
];

export function esFeriado(fecha: Date): Feriado | null {
  const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  return FERIADOS_ARGENTINA_2026.find((f) => f.fecha === fechaStr) || null;
}

export function esDiaHabil(fecha: Date): boolean {
  const dia = fecha.getDay();
  if (dia === 0 || dia === 6) return false;
  return !esFeriado(fecha);
}

export function obtenerHorarios(): HorarioAtencion[] {
  return HORARIOS_DEFAULT;
}

export function estaEnHorario(horarios: HorarioAtencion[], canal?: string): boolean {
  const ahora = new Date();
  const offset = -3;
  const horaLocal = new Date(ahora.getTime() + offset * 60 * 60 * 1000);
  const dia = horaLocal.getDay();
  const horaActual = `${String(horaLocal.getHours()).padStart(2, '0')}:${String(horaLocal.getMinutes()).padStart(2, '0')}`;

  const horariosFiltrados = canal
    ? horarios.filter((h) => h.nombre.toLowerCase().includes(canal.toLowerCase()))
    : horarios;

  return horariosFiltrados.some(
    (h) => h.activo && h.dia_semana.includes(dia) && horaActual >= h.hora_inicio && horaActual < h.hora_fin
  );
}

export function obtenerProximoHorario(horarios: HorarioAtencion[]): { fecha: Date; horario: HorarioAtencion } | null {
  const ahora = new Date();
  const offset = -3;
  const horaLocal = new Date(ahora.getTime() + offset * 60 * 60 * 1000);
  const dia = horaLocal.getDay();
  const horaActual = `${String(horaLocal.getHours()).padStart(2, '0')}:${String(horaLocal.getMinutes()).padStart(2, '0')}`;

  for (let diasAdelante = 0; diasAdelante <= 7; diasAdelante++) {
    const fechaBusqueda = new Date(horaLocal);
    fechaBusqueda.setDate(fechaBusqueda.getDate() + diasAdelante);
    const diaBusqueda = fechaBusqueda.getDay();

    const horariosDia = horarios.filter((h) => h.activo && h.dia_semana.includes(diaBusqueda));
    for (const h of horariosDia) {
      if (diasAdelante === 0 && horaActual >= h.hora_inicio) continue;
      const [horas, mins] = h.hora_inicio.split(':').map(Number);
      const fechaRetorno = new Date(fechaBusqueda);
      fechaRetorno.setHours(horas, mins, 0, 0);
      return { fecha: fechaRetorno, horario: h };
    }
  }
  return null;
}

export function diasHabilesEntre(inicio: Date, fin: Date): number {
  let count = 0;
  const actual = new Date(inicio);
  while (actual <= fin) {
    if (esDiaHabil(actual)) count++;
    actual.setDate(actual.getDate() + 1);
  }
  return count;
}

export function formatearHorario(horario: HorarioAtencion): string {
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const diasStr = horario.dia_semana.map((d) => dias[d]).join(', ');
  return `${diasStr}: ${horario.hora_inicio} - ${horario.hora_fin}`;
}
