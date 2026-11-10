'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import api, { extractData, mensajeError } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { Feriado } from '@/types';

export default function AdminFeriadosPage() {
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [fecha, setFecha] = useState('');
  const [nombre, setNombre] = useState('');
  const [repetirAnualmente, setRepetirAnualmente] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeriados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/horario-atencion/feriados');
      const lista = extractData<Feriado[]>(res) || [];
      setFeriados(
        [...lista].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),
      );
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar los feriados.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeriados();
  }, [fetchFeriados]);

  const filtrados = useMemo(
    () => feriados.filter((f) => f.nombre.toLowerCase().includes(busqueda.toLowerCase())),
    [feriados, busqueda],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/horario-atencion/feriados', {
        fecha,
        nombre,
        repetir_anualmente: repetirAnualmente,
      });
      setFecha('');
      setNombre('');
      setRepetirAnualmente(false);
      await fetchFeriados();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo crear el feriado.'));
    } finally {
      setSubmitting(false);
    }
  };

  const eliminar = async (feriado: Feriado) => {
    if (!confirm(`¿Eliminar el feriado "${feriado.nombre}"?`)) return;
    try {
      await api.delete(`/horario-atencion/feriados/${feriado.id_feriado}`);
      await fetchFeriados();
    } catch (err) {
      alert(mensajeError(err, 'No se pudo eliminar el feriado.'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Calendario de Feriados</h1>
        <p className="text-sm text-slate-400">
          Los feriados no cuentan como dias habiles para los SLA.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 p-5 md:grid-cols-[180px_1fr_auto_auto] md:items-end">
          <Input
            label="Fecha *"
            type="date"
            required
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
          <Input
            label="Nombre *"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <label className="flex items-center gap-2 pb-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={repetirAnualmente}
              onChange={(e) => setRepetirAnualmente(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800"
            />
            Repetir cada año
          </label>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Agregar
          </Button>
        </form>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar feriado..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-11"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-800/50" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <CalendarDays className="mx-auto mb-3 h-12 w-12 text-slate-600" />
            <p className="text-slate-400">No hay feriados registrados.</p>
          </div>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/70 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Repeticion</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtrados.map((feriado) => (
                <tr key={feriado.id_feriado} className="bg-slate-900/40">
                  <td className="px-4 py-3 text-white">
                    {feriado.fecha.slice(0, 10).split('-').reverse().join('/')}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{feriado.nombre}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {feriado.repetir_anualmente ? 'Anual' : 'Unica vez'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => eliminar(feriado)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
