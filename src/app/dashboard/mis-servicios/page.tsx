'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useAuthStore } from '@/store/auth';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Settings, Edit3, Save, X, ToggleLeft, ToggleRight, DollarSign, Tag } from 'lucide-react';

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

export default function MisServiciosPage() {
  const { user } = useAuthStore();
  const [servicios, setServicios] = useState<MiServicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [editData, setEditData] = useState({ precio_estimado: '', descripcion_personalizada: '', moneda: 'ARS' });
  const [saving, setSaving] = useState(false);

  const fetchServicios = useCallback(async () => {
    if (!user?.id_usuario) return;
    try {
      const res = await api.get('/servicios/mis-servicios');
      const data = extractData<any>(res);
      setServicios(data?.data || data || []);
    } catch {
      setServicios([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id_usuario]);

  useEffect(() => {
    fetchServicios();
  }, [fetchServicios]);

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

  const inputCls = 'w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Mis Servicios</h1>
        <span className="text-sm text-slate-400">{servicios.length} servicios</span>
      </div>

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
            <p className="text-sm text-slate-500 mt-1">Contactá al administrador para agregar servicios</p>
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
                    {s.descripcion && (
                      <p className="text-sm text-slate-400 line-clamp-1">{s.descripcion}</p>
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
                      <button
                        onClick={() => startEdit(s)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditing(null)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
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
                    {s.descripcion_personalizada && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Tag className="w-3 h-3" />
                        <span className="truncate max-w-xs">{s.descripcion_personalizada}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
