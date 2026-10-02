'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { Plus, Edit, Trash2, Save, X, Image as ImageIcon, Loader2, Search } from 'lucide-react';
import { Promocion, CreatePromocionDto, UpdatePromocionDto } from '@/types';

export default function AdminPromocionesPage() {
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Promocion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreatePromocionDto>({
    titulo: '',
    descripcion: '',
    precio: 0,
    moneda: 'ARS',
    imagen_url: '',
    enlace: '',
    activa: true,
    orden: 0,
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
  });

  const fetchPromociones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/promociones');
      const raw = extractData<Promocion[] | { data?: Promocion[] }>(res);
      const lista = Array.isArray(raw) ? raw : raw?.data || [];
      setPromociones(Array.isArray(lista) ? lista : []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromociones();
  }, [fetchPromociones]);

  const promocionesFiltradas = promociones.filter((p) =>
    p.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      precio: 0,
      moneda: 'ARS',
      imagen_url: '',
      enlace: '',
      activa: true,
      orden: 0,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: '',
    });
    setEditando(null);
    setPreviewUrl(null);
  };

  const abrirModalCrear = () => {
    resetForm();
    setModalAbierto(true);
  };

  const abrirModalEditar = (promocion: Promocion) => {
    setFormData({
      titulo: promocion.titulo,
      descripcion: promocion.descripcion,
      precio: promocion.precio,
      moneda: promocion.moneda,
      imagen_url: promocion.imagen_url,
      enlace: promocion.enlace || '',
      activa: promocion.activa,
      orden: promocion.orden,
      fecha_inicio: promocion.fecha_inicio.split('T')[0],
      fecha_fin: promocion.fecha_fin?.split('T')[0] || '',
    });
    setEditando(promocion);
    setPreviewUrl(promocion.imagen_url);
    setModalAbierto(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData(prev => ({ ...prev, imagen_url: base64 }));
        setPreviewUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = { ...formData };
      if (!payload.fecha_fin) delete payload.fecha_fin;
      if (!payload.enlace) delete payload.enlace;

      if (editando) {
        await api.patch(`/promociones/${editando.id_promocion}`, payload);
      } else {
        await api.post('/promociones', payload);
      }
      fetchPromociones();
      setModalAbierto(false);
      resetForm();
    } catch (error) {
      console.error('Error guardando promoción:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta promoción?')) return;
    try {
      await api.delete(`/promociones/${id}`);
      fetchPromociones();
    } catch (error) {
      console.error('Error eliminando promoción:', error);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/logo-institucional.png';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Gestión de Promociones</h1>
        <Button onClick={abrirModalCrear}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Promoción
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          type="text"
          placeholder="Buscar promociones..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-11"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : promocionesFiltradas.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No se encontraron promociones</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {promocionesFiltradas.map((p) => (
            <Card key={p.id_promocion} className="relative overflow-hidden">
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={p.imagen_url}
                  alt={p.titulo}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-slate-900/80 hover:bg-slate-900"
                    onClick={() => abrirModalEditar(p)}
                  >
                    <Edit className="w-4 h-4 text-white" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-slate-900/80 hover:bg-red-900/50"
                    onClick={() => handleEliminar(p.id_promocion)}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex justify-between">
                  <span className={`text-xs px-2 py-1 rounded ${
                    p.activa ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {p.activa ? 'Activa' : 'Inactiva'}
                  </span>
                  <span className="text-xs px-2 py-1 bg-slate-900/80 text-white rounded">
                    Orden: {p.orden}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white mb-1 line-clamp-1">{p.titulo}</h3>
                <p className="text-sm text-slate-400 line-clamp-2 mb-3">{p.descripcion}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-cyan-400">
                    {p.precio.toLocaleString('es-AR', { style: 'currency', currency: p.moneda, minimumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(p.fecha_inicio).toLocaleDateString('es-AR')}
                    {p.fecha_fin && ` - ${new Date(p.fecha_fin).toLocaleDateString('es-AR')}`}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl border border-slate-700">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editando ? 'Editar Promoción' : 'Nueva Promoción'}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => { setModalAbierto(false); resetForm(); }}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Título *</label>
                  <Input
                    value={formData.titulo}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Título de la promoción"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Descripción *</label>
                  <Textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Descripción de la promoción"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Precio *</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio}
                    onChange={(e) => setFormData(prev => ({ ...prev, precio: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Moneda</label>
                  <Select
                    value={formData.moneda}
                    onChange={(e) => setFormData(prev => ({ ...prev, moneda: e.target.value }))}
                    options={[
                      { value: 'ARS', label: 'ARS - Pesos Argentinos' },
                      { value: 'USD', label: 'USD - Dólares' },
                    ]}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Imagen *</label>
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                    />
                    {previewUrl && (
                      <div className="mt-2 relative w-32 h-20 rounded-lg overflow-hidden">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Formatos: JPG, PNG, WebP. Recomendado 1920x1080px</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Enlace (opcional)</label>
                  <Input
                    type="url"
                    value={formData.enlace}
                    onChange={(e) => setFormData(prev => ({ ...prev, enlace: e.target.value }))}
                    placeholder="https://ejemplo.com/promocion"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Orden</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.orden}
                    onChange={(e) => setFormData(prev => ({ ...prev, orden: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Fecha inicio *</label>
                  <Input
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Fecha fin (opcional)</label>
                  <Input
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha_fin: e.target.value }))}
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activa"
                    checked={formData.activa}
                    onChange={(e) => setFormData(prev => ({ ...prev, activa: e.target.checked }))}
                    className="w-4 h-4 text-cyan-500 border-slate-600 rounded focus:ring-cyan-500"
                  />
                  <label htmlFor="activa" className="text-sm text-slate-300">Promoción activa</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <Button type="button" variant="outline" onClick={() => { setModalAbierto(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  {editando ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}