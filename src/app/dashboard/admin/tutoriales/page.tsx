'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Edit, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import api, { extractData, mensajeError } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import type { CreateTutorialDto, Tutorial } from '@/types';

const FORM_INICIAL: CreateTutorialDto = {
  categoria: '',
  titulo: '',
  descripcion: '',
  url_video: '',
  url_thumbnail: '',
  duracion_segundos: 0,
  tags: [],
  orden: 0,
  tipo_contenido: 'guia',
  activo: true,
};

export default function AdminTutorialesPage() {
  const [tutoriales, setTutoriales] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Tutorial | null>(null);
  const [formData, setFormData] = useState<CreateTutorialDto>(FORM_INICIAL);
  const [tagsTexto, setTagsTexto] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTutoriales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/centro-ayuda/tutoriales/admin/todos');
      setTutoriales(extractData<Tutorial[]>(res) || []);
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar los tutoriales.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTutoriales();
  }, [fetchTutoriales]);

  const filtrados = useMemo(
    () =>
      tutoriales.filter(
        (t) =>
          t.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
          t.categoria.toLowerCase().includes(busqueda.toLowerCase()),
      ),
    [tutoriales, busqueda],
  );

  const resetForm = () => {
    setFormData(FORM_INICIAL);
    setTagsTexto('');
    setEditando(null);
    setError(null);
  };

  const abrirCrear = () => {
    resetForm();
    setModalAbierto(true);
  };

  const abrirEditar = (tutorial: Tutorial) => {
    setFormData({
      categoria: tutorial.categoria,
      titulo: tutorial.titulo,
      descripcion: tutorial.descripcion,
      url_video: tutorial.url_video || '',
      url_thumbnail: tutorial.url_thumbnail || '',
      duracion_segundos: tutorial.duracion_segundos || 0,
      tags: tutorial.tags || [],
      orden: tutorial.orden,
      tipo_contenido: tutorial.tipo_contenido,
      activo: tutorial.activo,
    });
    setTagsTexto((tutorial.tags || []).join(', '));
    setEditando(tutorial);
    setError(null);
    setModalAbierto(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload: CreateTutorialDto = {
        ...formData,
        tags: tagsTexto
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        duracion_segundos: Number(formData.duracion_segundos) || 0,
        orden: Number(formData.orden) || 0,
      };

      if (editando) {
        await api.patch(`/centro-ayuda/tutoriales/${editando.id_tutorial}`, payload);
      } else {
        await api.post('/centro-ayuda/tutoriales', payload);
      }

      setModalAbierto(false);
      resetForm();
      await fetchTutoriales();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo guardar el tutorial.'));
    } finally {
      setSubmitting(false);
    }
  };

  const eliminar = async (tutorial: Tutorial) => {
    if (!confirm(`¿Eliminar el tutorial "${tutorial.titulo}"?`)) return;
    try {
      await api.delete(`/centro-ayuda/tutoriales/${tutorial.id_tutorial}`);
      await fetchTutoriales();
    } catch (err) {
      alert(mensajeError(err, 'No se pudo eliminar el tutorial.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestion de Tutoriales</h1>
          <p className="text-sm text-slate-400">
            Contenido que se muestra en el centro de ayuda publico.
          </p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Tutorial
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar por titulo o categoria..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-11"
        />
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
      ) : filtrados.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <BookOpen className="mx-auto mb-3 h-12 w-12 text-slate-600" />
            <p className="text-slate-400">No hay tutoriales cargados.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtrados.map((tutorial) => (
            <Card key={tutorial.id_tutorial}>
              <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-white">{tutorial.titulo}</h3>
                    <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                      {tutorial.categoria}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                        tutorial.activo
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-slate-500/15 text-slate-400'
                      }`}
                    >
                      {tutorial.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-400">{tutorial.descripcion}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Tipo: {tutorial.tipo_contenido} · Orden: {tutorial.orden} · Vistas:{' '}
                    {tutorial.veces_visto}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => abrirEditar(tutorial)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => eliminar(tutorial)}>
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-700 p-6">
              <h2 className="text-xl font-bold text-white">
                {editando ? 'Editar Tutorial' : 'Nuevo Tutorial'}
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
                  label="Titulo *"
                  required
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                />
                <Input
                  label="Categoria *"
                  required
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                />
              </div>

              <Textarea
                label="Descripcion *"
                required
                rows={4}
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label="Tipo de contenido"
                  value={formData.tipo_contenido}
                  onChange={(e) =>
                    setFormData({ ...formData, tipo_contenido: e.target.value })
                  }
                  options={[
                    { value: 'guia', label: 'Guia' },
                    { value: 'video', label: 'Video' },
                    { value: 'articulo', label: 'Articulo' },
                  ]}
                />
                <Input
                  label="Orden"
                  type="number"
                  min={0}
                  value={formData.orden}
                  onChange={(e) =>
                    setFormData({ ...formData, orden: Number(e.target.value) })
                  }
                />
                <Input
                  label="Duracion (segundos)"
                  type="number"
                  min={0}
                  value={formData.duracion_segundos}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duracion_segundos: Number(e.target.value),
                    })
                  }
                />
                <Input
                  label="Tags (separados por coma)"
                  value={tagsTexto}
                  onChange={(e) => setTagsTexto(e.target.value)}
                />
                <Input
                  label="URL del video"
                  value={formData.url_video}
                  onChange={(e) => setFormData({ ...formData, url_video: e.target.value })}
                />
                <Input
                  label="URL del thumbnail"
                  value={formData.url_thumbnail}
                  onChange={(e) =>
                    setFormData({ ...formData, url_thumbnail: e.target.value })
                  }
                />
              </div>

              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) =>
                    setFormData({ ...formData, activo: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                />
                Visible en el centro de ayuda
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
                  {editando ? 'Guardar cambios' : 'Crear tutorial'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
