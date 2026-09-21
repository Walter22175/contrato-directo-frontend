'use client';

import { useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { formatearHorario, esDiaHabil, esFeriado, diasHabilesEntre } from '@/lib/horarios';
import { Clock, Calendar, Check, X } from 'lucide-react';
import type { HorarioAtencion } from '@/types';

const HORARIOS_DEFAULT: HorarioAtencion[] = [
  { id_horario: 1, nombre: 'Estándar', dia_semana: [1, 2, 3, 4, 5], hora_inicio: '08:00', hora_fin: '20:00', activo: true },
  { id_horario: 2, nombre: 'Reducido Sábado', dia_semana: [6], hora_inicio: '09:00', hora_fin: '13:00', activo: true },
  { id_horario: 3, nombre: 'WhatsApp', dia_semana: [1, 2, 3, 4, 5], hora_inicio: '09:00', hora_fin: '20:00', activo: true },
  { id_horario: 4, nombre: 'WhatsApp Sábado', dia_semana: [6], hora_inicio: '09:00', hora_fin: '14:00', activo: true },
  { id_horario: 5, nombre: 'Teléfono', dia_semana: [1, 2, 3, 4, 5], hora_inicio: '10:00', hora_fin: '18:00', activo: true },
  { id_horario: 6, nombre: 'Redes Sociales', dia_semana: [1, 2, 3, 4, 5], hora_inicio: '09:00', hora_fin: '18:00', activo: true },
];

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function GestionHorarios() {
  const [horarios] = useState<HorarioAtencion[]>(HORARIOS_DEFAULT);

  const hoy = new Date();
  const feriado = esFeriado(hoy);
  const esHabil = esDiaHabil(hoy);

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-4">
          <CardTitle>Estado Actual</CardTitle>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Fecha</span>
              </div>
              <p className="text-white font-medium">{hoy.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                {esHabil ? <Check className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-red-400" />}
                <span className="text-sm text-slate-400">Día hábil</span>
              </div>
              <p className={esHabil ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                {esHabil ? 'Sí' : 'No'}
              </p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Feriado</span>
              </div>
              <p className="text-white font-medium">{feriado ? feriado.nombre : 'No es feriado'}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <CardTitle>Horarios de Atención</CardTitle>
          <div className="mt-4 space-y-3">
            {horarios.map((h) => (
              <div key={h.id_horario} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-sm font-medium text-white">{h.nombre}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{formatearHorario(h)}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {DIAS.map((d, i) => (
                    <span
                      key={i}
                      className={`w-7 h-7 flex items-center justify-center rounded text-xs ${
                        h.dia_semana.includes(i)
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-slate-700/50 text-slate-600'
                      }`}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <CardTitle>Zona Horaria</CardTitle>
          <p className="text-sm text-slate-400 mt-2">Todos los horarios están expresados en hora de Argentina (GMT-3).</p>
          <p className="text-sm text-slate-400 mt-1">Domingos y feriados: Solo atención por email (respuesta en 24h hábiles) y centro de ayuda (autoservicio).</p>
        </div>
      </Card>
    </div>
  );
}
