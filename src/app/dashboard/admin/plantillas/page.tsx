'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit, Eye, Loader2, Mail, Plus, Search, Trash2, X } from 'lucide-react';
import api, { extractData, mensajeError } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import type {
  CreatePlantillaDto,
  PlantillaNotificacion,
  PreviewPlantilla,
} from '@/types';

const CANALES = [
  { value: 'email', label: 'Email' },
  { value: 'plataforma', label: 'Plataforma' },
  { value: 'push', label: 'Push' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
];

const FORM_INICIAL: CreatePlantillaDto = {
  evento: '',
  asunto: '',
  cuerpo_html: '',
  cuerpo_texto: '',
  variables_disponibles: [],
  canal: 'email',
  idioma: 'es',
  activo: true,
};

export default function AdminPlantillasPage() {
  const [plantillas, setPlantillas] = useState<PlantillaNotificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCanal, setFiltroCanal] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<PlantillaNotificacion | null>(null);
  const [formData, setFormData] = useState<CreatePlantillaDto>(FORM_INICIAL);
  const [variablesTexto, setVariablesTexto] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewPlantilla | null>(null);
  const [previewAbierto, setPreviewAbierto] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchPlantillas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/plantillas', {
        params: filtroCanal ? { canal: filtroCanal } : undefined,
      });
      setPlantillas(extractData<PlantillaNotificacion[]>(res) || []);
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar las plantillas.'));
    } finally {
      setLoading(false);
    }
  }, [filtroCanal]);

  useEffect(() => {
    fetchPlantillas();
  }, [fetchPlantillas]);

  const filtradas = useMemo(
    () =>
      plantillas.filter(
        (p) =>
          p.evento.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.asunto.toLowerCase().includes(busqueda.toLowerCase()),
      ),
    [plantillas, busqueda],
  );

  const resetForm = () => {
    setFormData(FORM_INICIAL);
    setVariablesTexto('');
    setEditando(null);
    setError(null);
  };

  const abrirCrear = () => {
    resetForm();
    setModalAbierto(true);
  };

  const abrirEditar = (plantilla: PlantillaNotificacion) => {
    setFormData({
      evento: plantilla.evento,
      asunto: plantilla.asunto,
      cuerpo_html: plantilla.cuerpo_html,
      cuerpo_texto: plantilla.cuerpo_texto || '',
      variables_disponibles: plantilla.variables_disponibles || [],
      canal: plantilla.canal,
      idioma: plantilla.idioma,
      activo: plantilla.activo,
    });
    setVariablesTexto((plantilla.variables_disponibles || []).join(', '));
    setEditando(plantilla);
    setError(null);
    setModalAbierto(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload: CreatePlantillaDto = {
        ...formData,
        variables_disponibles: variablesTexto
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
      };

      if (editando) {
        await api.patch(`/admin/plantillas/${editando.id_plantilla}`, payload);
      } else {
        await api.post('/admin/plantillas', payload);
      }

      setModalAbierto(false);
      resetForm();
      await fetchPlantillas();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo guardar la plantilla.'));
    } finally {
      setSubmitting(false);
    }
  };

  const eliminar = async (plantilla: PlantillaNotificacion) => {
    if (!confirm(`¿Eliminar la plantilla del evento "${plantilla.evento}"?`)) return;
    try {
      await api.delete(`/admin/plantillas/${plantilla.id_plantilla}`);
      await fetchPlantillas();
    } catch (err) {
      alert(mensajeError(err, 'No se pudo eliminar la plantilla.'));
    }
  };

  const abrirPreview = async (plantilla: PlantillaNotificacion) => {
    setPreviewAbierto(true);
    setPreviewLoading(true);
    setPreview(null);
    try {
      const variables: Record<string, string> = {};
      for (const variable of plantilla.variables_disponibles || []) {
        variables[variable] = `[${variable}]`;
      }
      const res = await api.post(`/admin/plantillas/${plantilla.id_plantilla}/preview`, {
        variables,
      });
      setPreview(extractData<PreviewPlantilla>(res));
    } catch (err) {
      alert(mensajeError(err, 'No se pudo generar la vista previa.'));
      setPreviewAbierto(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Plantillas de Notificacion</h1>
          <p className="text-sm text-slate-400">
            Mensajes por evento, canal e idioma. Usa {'{{variable}}'} para insertar datos.
          </p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Plantilla
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por evento o asunto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-11"
          />
        </div>
        <div className="w-52">
          <Select
            value={filtroCanal}
            onChange={(e) => setFiltroCanal(e.target.value)}
            options={[{ value: '', label: 'Todos los canales' }, ...CANALES]}
          />
        </div>
      </div>

      {error && !modalAbierto && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-800/50" />
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Mail className="mx-auto mb-3 h-12 w-12 text-slate-600" />
            <p className="text-slate-400">No hay plantillas para los filtros elegidos.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtradas.map((plantilla) => (
            <Card key={plantilla.id_plantilla}>
              <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-mono text-sm font-semibold text-cyan-300">
                      {plantilla.evento}
                    </h3>
                    <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                      {plantilla.canal}
                    </span>
                    <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                      {plantilla.idioma}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                        plantilla.activo
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-slate-500/15 text-slate-400'
                      }`}
                    >
                      {plantilla.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <p className="truncate text-sm text-slate-300">{plantilla.asunto}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Variables: {(plantilla.variables_disponibles || []).join(', ') || 'ninguna'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => abrirPreview(plantilla)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => abrirEditar(plantilla)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => eliminar(plantilla)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-700 p-6">
              <h2 className="text-xl font-bold text-white">
                {editando ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setModalAbierto(false);
                  resetForm();
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Evento *"
                  required
                  value={formData.evento}
                  onChange={(e) => setFormData({ ...formData, evento: e.target.value })}
                />
                <Input
                  label="Idioma"
                  value={formData.idioma}
                  onChange={(e) => setFormData({ ...formData, idioma: e.target.value })}
                />
                <Select
                  label="Canal"
                  value={formData.canal}
                  onChange={(e) => setFormData({ ...formData, canal: e.target.value })}
                  options={CANALES}
                />
                <Input
                  label="Variables (separadas por coma)"
                  value={variablesTexto}
                  onChange={(e) => setVariablesTexto(e.target.value)}
                />
              </div>

              <Input
                label="Asunto *"
                required
                value={formData.asunto}
                onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
              />

              <Textarea
                label="Cuerpo HTML *"
                required
                rows={8}
                className="font-mono text-sm"
                value={formData.cuerpo_html}
                onChange={(e) => setFormData({ ...formData, cuerpo_html: e.target.value })}
              />

              <Textarea
                label="Cuerpo en texto plano"
                rows={4}
                value={formData.cuerpo_texto}
                onChange={(e) => setFormData({ ...formData, cuerpo_texto: e.target.value })}
              />

              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                />
                Plantilla activa
              </label>

              <div className="flex justify-end gap-3 border-t border-slate-700 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setModalAbierto(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editando ? 'Guardar cambios' : 'Crear plantilla'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-700 p-6">
              <h2 className="text-xl font-bold text-white">Vista previa</h2>
              <Button variant="ghost" size="sm" onClick={() => setPreviewAbierto(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6">
              {previewLoading ? (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generando vista previa...
                </div>
              ) : preview ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                      Asunto
                    </p>
                    <p className="text-white">{preview.asunto}</p>
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">
                      Cuerpo HTML
                    </p>
                    <div
                      className="rounded-xl border border-slate-700 bg-white p-4 text-sm text-slate-900"
                      dangerouslySetInnerHTML={{ __html: preview.cuerpo_html }}
                    />
                  </div>
                  {preview.cuerpo_texto && (
                    <div>
                      <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        Texto plano
                      </p>
                      <pre className="whitespace-pre-wrap rounded-xl border border-slate-700 bg-slate-800 p-4 text-sm text-slate-300">
                        {preview.cuerpo_texto}
                      </pre>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
