'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Users, Search, Shield, CheckCircle, XCircle, Eye } from 'lucide-react';
import type { Usuario } from '@/types';

type Tab = 'todos' | 'pendientes' | 'verificados';

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (tab === 'pendientes') params.estado = 'pendiente';
      if (tab === 'verificados') params.estado = 'verificado';
      if (busqueda) params.busqueda = busqueda;
      const res = await api.get('/usuarios', { params });
      const data = extractData<any>(res);
      setUsuarios(data?.data || data || []);
    } catch {
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, [tab, busqueda]);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  const formatearFecha = (f: string) =>
    new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

  const rolBadge = (u: Usuario) => {
    const rol = u.usuario_roles?.[0]?.rol?.nombre || 'sin_rol';
    const colors: Record<string, string> = {
      super_admin: 'text-red-400 bg-red-500/10',
      sistemas: 'text-purple-400 bg-purple-500/10',
      admin_contable: 'text-yellow-400 bg-yellow-500/10',
      admin_comercial: 'text-orange-400 bg-orange-500/10',
      cliente: 'text-cyan-400 bg-cyan-500/10',
      proveedor: 'text-green-400 bg-green-500/10',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded ${colors[rol] || 'text-slate-400 bg-slate-500/10'}`}>
        {rol.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Gestión de Usuarios</h1>
      </div>

      <div className="flex gap-1 border-b border-slate-700">
        {(['todos', 'pendientes', 'verificados'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            {t === 'todos' ? 'Todos' : t === 'pendientes' ? 'Pendientes' : 'Verificados'}
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : usuarios.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No se encontraron usuarios</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {usuarios.map((u) => (
            <div
              key={u.id_usuario}
              onClick={() => setSelectedUser(selectedUser?.id_usuario === u.id_usuario ? null : u)}
              className="flex items-center gap-4 p-4 bg-slate-800/30 border border-slate-800 rounded-xl hover:bg-slate-800/60 cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm text-slate-300">
                  {u.nombre?.[0]}{u.apellido?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-white truncate">{u.nombre} {u.apellido}</h3>
                  {rolBadge(u)}
                </div>
                <p className="text-xs text-slate-500 truncate">{u.email}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  u.estado === 'activo' ? 'text-green-400 bg-green-500/10' :
                  u.estado === 'pendiente' ? 'text-yellow-400 bg-yellow-500/10' :
                  'text-slate-400 bg-slate-500/10'
                }`}>
                  {u.estado}
                </span>
                <span className="text-xs text-slate-600">{formatearFecha(u.fecha_registro)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedUser && (
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Detalle del Usuario</h2>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Nombre:</span>
                <p className="text-white">{selectedUser.nombre} {selectedUser.apellido}</p>
              </div>
              <div>
                <span className="text-slate-400">Email:</span>
                <p className="text-white">{selectedUser.email}</p>
              </div>
              <div>
                <span className="text-slate-400">Estado:</span>
                <p className="text-white">{selectedUser.estado}</p>
              </div>
              <div>
                <span className="text-slate-400">Registro:</span>
                <p className="text-white">{formatearFecha(selectedUser.fecha_registro)}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
