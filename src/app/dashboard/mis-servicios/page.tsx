'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import api, { extractData, mensajeError } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Settings, Edit3, Save, X, ToggleLeft, ToggleRight, DollarSign, Plus, Search, Loader2, Trash2 } from 'lucide-react';
import type { Servicio, Categoria } from '@/types';

interface MiServicio {
  id_servicio_proveedor: number;
  id_servicio: number;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  id_categoria?: number;
  precio_estimado?: number;
  moneda: string;
  descripcion_personalizada?: string;
  disponible: boolean;
  fecha_creacion: string;
}

interface Msg {
  tipo: 'ok' | 'error';
  texto: string;
}

export default function MisServiciosPage() {
  const { user, loadUser } = useAuthStore();
  const [servicios, setServicios] = useState<MiServicio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [editData, setEditData] = useState({ precio_estimado: '', descripcion_personalizada: '', moneda: 'ARS' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<Msg | null>(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [catalogo, setCatalogo] = useState<Servicio[]>([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [form, setForm] = useState({ precio_estimado: '', moneda: 'ARS', descripcion_personalizada: '' });
  const [enviando, setEnviando] = useState(false);
  const [servicioAEliminar, setServicioAEliminar] = useState<MiServicio | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const fetchServicios = useCallback(async () => {
    if (!user?.id_usuario) return;
    try {
      const res = await api.get('/servicios/mis-servicios');
      const data = extractData<MiServicio[] | { data?: MiServicio[] } | null>(res);
      setServicios(Array.isArray(data) ? data : data?.data || []);
    } catch {
      setServicios([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id_usuario]);

  useEffect(() => {
    fetchServicios();
  }, [fetchServicios]);

  // Refresca el usuario para tener las categorías asignadas al rol proveedor
  // vigentes (puede haber cambiado desde que inició sesión).
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    api
      .get('/catalogo/categorias', { params: { activa: true } })
      .then((res) => {
        const data = extractData<Categoria[] | { data?: Categoria[] } | null>(res);
        setCategorias(Array.isArray(data) ? data : data?.data || []);
      })
      .catch(() => setCategorias([]));
  }, []);

  // Categorías que el super admin asignó al rol proveedor del usuario.
  // null = sin restricción (rol anterior a esta funcionalidad o sin checks).
  const categoriasPermitidas = useMemo(() => {
    const rolProveedor = (user?.usuario_roles || []).find(
      (ur) => ur.activo && ur.rol?.nombre === 'proveedor',
    );
    const ids = rolProveedor?.categorias;
    return Array.isArray(ids) && ids.length > 0 ? new Set(ids) : null;
  }, [user]);

  const nombresCategoriasPermitidas = useMemo(() => {
    if (!categoriasPermitidas) return [];
    return categorias
      .filter((c) => categoriasPermitidas.has(c.id_categoria))
      .map((c) => c.nombre);
  }, [categorias, categoriasPermitidas]);

  useEffect(() => {
    if (!modalAbierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalAbierto(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalAbierto]);

  const abrirModal = async () => {
    setMsg(null);
    setBusqueda('');
    setSeleccion(null);
    setForm({ precio_estimado: '', moneda: 'ARS', descripcion_personalizada: '' });
    setModalAbierto(true);
    setCargandoCatalogo(true);
    try {
      const res = await api.get('/servicios', { params: { activo: true } });
      const raw = extractData<Servicio[] | { data?: Servicio[] } | null>(res);
      const lista = (Array.isArray(raw) ? raw : raw?.data) || [];
      const yaAgregados = new Set(servicios.map((s) => s.id_servicio));
      setCatalogo(
        lista.filter(
          (s) =>
            !yaAgregados.has(s.id_servicio) &&
            (!categoriasPermitidas || categoriasPermitidas.has(s.id_categoria)),
        ),
      );
    } catch {
      setCatalogo([]);
    } finally {
      setCargandoCatalogo(false);
    }
  };

  const serviciosDisponibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return catalogo;
    return catalogo.filter(
      (s) =>
        s.nombre.toLowerCase().includes(q) ||
        (s.descripcion || '').toLowerCase().includes(q) ||
        (s.categoria?.nombre || '').toLowerCase().includes(q),
    );
  }, [catalogo, busqueda]);

  const handleAgregar = async () => {
    if (!seleccion) return;
    setEnviando(true);
    try {
      await api.post('/servicios/mis-servicios', {
        id_servicio: seleccion,
        ...(form.precio_estimado ? { precio_estimado: parseFloat(form.precio_estimado) } : {}),
        moneda: form.moneda,
        ...(form.descripcion_personalizada
          ? { descripcion_personalizada: form.descripcion_personalizada }
          : {}),
      });
      setModalAbierto(false);
      setMsg({ tipo: 'ok', texto: 'Servicio agregado a tu muro' });
      await fetchServicios();
    } catch (err) {
      setMsg({ tipo: 'error', texto: mensajeError(err, 'No se pudo agregar el servicio') });
    } finally {
      setEnviando(false);
    }
  };

  const startEdit = (s: MiServicio) => {
    setEditing(s.id_servicio_proveedor);
    setEditData({
      precio_estimado: s.precio_estimado?.toString() || '',
      descripcion_personalizada: s.descripcion_personalizada || '',
      moneda: s.moneda || 'ARS',
    });
  };

  const handleSave = async (id: number) => {
    setSaving(true);
    try {
      await api.patch(`/servicios/asociacion/${id}`, {
        precio_estimado: editData.precio_estimado ? parseFloat(editData.precio_estimado) : null,
        descripcion_personalizada: editData.descripcion_personalizada || null,
        moneda: editData.moneda,
      });
      setEditing(null);
      await fetchServicios();
    } catch {} finally {
      setSaving(false);
    }
  };

  const toggleDisponibilidad = async (s: MiServicio) => {
    try {
      await api.patch(`/servicios/asociacion/${s.id_servicio_proveedor}`, {
        disponible: !s.disponible,
      });
      await fetchServicios();
    } catch {}
  };

  const confirmarEliminacion = async () => {
    if (!servicioAEliminar) return;
    setEliminando(true);
    setMsg(null);
    try {
      await api.delete(`/servicios/asociacion/${servicioAEliminar.id_servicio_proveedor}`);
      setServicioAEliminar(null);
      setMsg({ tipo: 'ok', texto: `"${servicioAEliminar.nombre}" fue eliminado de tu muro` });
      if (editing === servicioAEliminar.id_servicio_proveedor) setEditing(null);
      setServicios((actuales) =>
        actuales.filter((servicio) => servicio.id_servicio_proveedor !== servicioAEliminar.id_servicio_proveedor),
      );
    } catch (err) {
      setMsg({ tipo: 'error', texto: mensajeError(err, 'No se pudo eliminar el servicio') });
    } finally {
      setEliminando(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Mis Servicios</h1>
          <span className="text-sm text-slate-400">{servicios.length} servicios</span>
        </div>
        <button
          onClick={abrirModal}
          data-testid="abrir-agregar-servicio"
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar servicio
        </button>
      </div>

      {msg && (
        <div
          data-testid="msg-flash"
          className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm ${
            msg.tipo === 'ok' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
          }`}
        >
          <span>{msg.texto}</span>
          <button onClick={() => setMsg(null)} className="p-1 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : servicios.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Aún no tenés servicios asociados</p>
            <p className="text-sm text-slate-500 mt-1">Elegí servicios de la plataforma y agregalos a tu muro</p>
            <button
              onClick={abrirModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar servicio
            </button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {servicios.map((s) => (
            <Card key={s.id_servicio_proveedor}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white">{s.nombre}</h3>
                      <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">
                        {s.categoria}
                      </span>
                    </div>
                    {(s.descripcion_personalizada || s.descripcion) && (
                      <p className="text-sm text-slate-400 line-clamp-1">{s.descripcion_personalizada || s.descripcion}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleDisponibilidad(s)}
                      className={`flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors ${
                        s.disponible
                          ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20'
                          : 'text-slate-500 bg-slate-700/50 hover:bg-slate-700'
                      }`}
                    >
                      {s.disponible ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {s.disponible ? 'Activo' : 'Inactivo'}
                    </button>
                    {editing !== s.id_servicio_proveedor ? (
                      <>
                        <button
                          onClick={() => startEdit(s)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                          title="Editar servicio"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setServicioAEliminar(s)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Eliminar del muro"
                          data-testid={`eliminar-servicio-${s.id_servicio_proveedor}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditing(null)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Cancelar edición"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {editing === s.id_servicio_proveedor ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-700">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-slate-400 mb-1">Precio</label>
                        <input
                          className={inputCls}
                          type="number"
                          placeholder="0"
                          value={editData.precio_estimado}
                          onChange={(e) => setEditData({ ...editData, precio_estimado: e.target.value })}
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-slate-400 mb-1">Moneda</label>
                        <select
                          className={inputCls}
                          value={editData.moneda}
                          onChange={(e) => setEditData({ ...editData, moneda: e.target.value })}
                        >
                          <option value="ARS">ARS</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-slate-400 mb-1">Descripción personalizada</label>
                      <input
                        className={inputCls}
                        placeholder="Descripción para este servicio..."
                        value={editData.descripcion_personalizada}
                        onChange={(e) => setEditData({ ...editData, descripcion_personalizada: e.target.value })}
                        maxLength={500}
                      />
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                      <button
                        onClick={() => handleSave(s.id_servicio_proveedor)}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 text-sm mt-2 pt-2 border-t border-slate-700/50">
                    {s.precio_estimado ? (
                      <div className="flex items-center gap-1 text-slate-300">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span>{s.precio_estimado.toLocaleString('es-AR')}</span>
                        <span className="text-slate-500">{s.moneda}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500">Sin precio</span>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setModalAbierto(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Agregar servicio a mi muro"
            data-testid="modal-agregar-servicio"
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <div>
                <h2 className="text-lg font-semibold text-white">Agregar servicio a mi muro</h2>
                <p className="text-xs text-slate-400">Elegí un servicio existente en la plataforma</p>
                {categoriasPermitidas && (
                  <p className="text-xs text-amber-400 mt-1" data-testid="categorias-permitidas">
                    Solo podés agregar servicios de tus categorías asignadas
                    {nombresCategoriasPermitidas.length > 0
                      ? `: ${nombresCategoriasPermitidas.join(', ')}`
                      : ''}
                  </p>
                )}
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-slate-700">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className={`${inputCls} pl-9`}
                  placeholder="Buscar servicio por nombre, categoría o descripción..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cargandoCatalogo ? (
                <div className="flex items-center justify-center py-10 text-slate-400 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Cargando servicios...
                </div>
              ) : catalogo.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-8">
                  {categoriasPermitidas
                    ? 'No hay servicios disponibles en tus categorías asignadas'
                    : 'Ya agregaste todos los servicios disponibles de la plataforma'}
                </p>
              ) : serviciosDisponibles.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-8">
                  No encontramos servicios que coincidan con tu búsqueda
                </p>
              ) : (
                <div className="space-y-2">
                  {serviciosDisponibles.map((s) => (
                    <button
                      key={s.id_servicio}
                      onClick={() => setSeleccion(s.id_servicio)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                        seleccion === s.id_servicio
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{s.nombre}</p>
                          {s.descripcion && (
                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{s.descripcion}</p>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded shrink-0">
                          {s.categoria?.nombre}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {seleccion && (
              <div className="px-6 py-4 border-t border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-400 mb-1">Precio (opcional)</label>
                    <input
                      className={inputCls}
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.precio_estimado}
                      onChange={(e) => setForm({ ...form, precio_estimado: e.target.value })}
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs text-slate-400 mb-1">Moneda</label>
                    <select
                      className={inputCls}
                      value={form.moneda}
                      onChange={(e) => setForm({ ...form, moneda: e.target.value })}
                    >
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Descripción personalizada (opcional)</label>
                  <input
                    className={inputCls}
                    placeholder="Cómo ofrecés este servicio..."
                    maxLength={500}
                    value={form.descripcion_personalizada}
                    onChange={(e) => setForm({ ...form, descripcion_personalizada: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700">
              <button
                onClick={() => setModalAbierto(false)}
                disabled={enviando}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAgregar}
                disabled={!seleccion || enviando}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {enviando && <Loader2 className="w-4 h-4 animate-spin" />}
                {enviando ? 'Agregando...' : 'Agregar a mi muro'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={servicioAEliminar !== null}
        titulo="Eliminar servicio del muro"
        mensaje={`¿Estás seguro de que querés eliminar "${servicioAEliminar?.nombre}" de tu muro? Esta acción no afecta el catálogo de la plataforma y podés volver a agregarlo más adelante.`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        loading={eliminando}
        onConfirm={confirmarEliminacion}
        onCancel={() => setServicioAEliminar(null)}
      />
    </div>
  );
}
