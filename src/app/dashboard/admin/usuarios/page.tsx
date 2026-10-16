'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Users, Search, XCircle, Shield, Plus, X } from 'lucide-react';
import type { Usuario, Rol } from '@/types';

type Tab = 'todos' | 'pendientes' | 'verificados';

type RespuestaApi<T> = T & { data?: T };

type ErrorApi = { response?: { data?: { message?: string } } };

const mensajeDeError = (error: unknown, fallback: string): string =>
  (error as ErrorApi | undefined)?.response?.data?.message || fallback;

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [cambiando, setCambiando] = useState<string | null>(null);
  const [rolesCatalogo, setRolesCatalogo] = useState<Rol[]>([]);
  const [nuevoRol, setNuevoRol] = useState('');
  const [guardandoRol, setGuardandoRol] = useState(false);
  const [busquedaDebounced, setBusquedaDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setBusquedaDebounced(busqueda), 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (tab === 'pendientes') params.estado = 'pendiente';
      if (tab === 'verificados') params.estado = 'verificado';
      if (busquedaDebounced) params.search = busquedaDebounced;
      const res = await api.get<RespuestaApi<Usuario[]>>('/usuarios', { params });
      const data = extractData<RespuestaApi<Usuario[]> | null>(res);
      setUsuarios(data?.data || data || []);
    } catch {
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, [tab, busquedaDebounced]);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  useEffect(() => {
    api
      .get<RespuestaApi<Rol[]>>('/roles')
      .then((res) => {
        const data = extractData<RespuestaApi<Rol[]> | null>(res);
        setRolesCatalogo(data?.data || data || []);
      })
      .catch(() => setRolesCatalogo([]));
  }, []);

  const asignarRol = async () => {
    if (!selectedUser || !nuevoRol) return;
    setGuardandoRol(true);
    setMsg(null);
    try {
      await api.post(`/usuarios/${selectedUser.id_usuario}/roles`, { rol: nuevoRol });
      const res = await api.get<RespuestaApi<Usuario>>(`/usuarios/${selectedUser.id_usuario}`);
      const actualizado = extractData<Usuario>(res);
      if (actualizado) {
        setSelectedUser(actualizado);
        setUsuarios((prev) =>
          prev.map((x) => (x.id_usuario === actualizado.id_usuario ? actualizado : x))
        );
      }
      setMsg({ tipo: 'ok', texto: `Rol "${nuevoRol}" asignado a ${selectedUser.nombre} ${selectedUser.apellido}` });
      setNuevoRol('');
    } catch (e) {
      setMsg({ tipo: 'error', texto: mensajeDeError(e, 'Error al asignar el rol') });
    } finally {
      setGuardandoRol(false);
    }
  };

  const quitarRol = async (idRol: number, nombreRol: string) => {
    if (!selectedUser || !idRol) return;
    setGuardandoRol(true);
    setMsg(null);
    try {
      await api.delete(`/usuarios/${selectedUser.id_usuario}/roles/${idRol}`);
      const res = await api.get<RespuestaApi<Usuario>>(`/usuarios/${selectedUser.id_usuario}`);
      const actualizado = extractData<Usuario>(res);
      if (actualizado) {
        setSelectedUser(actualizado);
        setUsuarios((prev) =>
          prev.map((x) => (x.id_usuario === actualizado.id_usuario ? actualizado : x))
        );
      }
      setMsg({ tipo: 'ok', texto: `Rol "${nombreRol}" quitado a ${selectedUser.nombre} ${selectedUser.apellido}` });
    } catch (e) {
      setMsg({ tipo: 'error', texto: mensajeDeError(e, 'Error al quitar el rol') });
    } finally {
      setGuardandoRol(false);
    }
  };

  const cambiarEstado = async (u: Usuario) => {
    const nuevo = u.estado === 'activo' ? 'suspendido' : 'activo';
    setCambiando(u.id_usuario);
    setMsg(null);
    try {
      await api.patch(`/usuarios/${u.id_usuario}/estado`, { estado: nuevo });
      setUsuarios((prev) =>
        prev.map((x) => (x.id_usuario === u.id_usuario ? { ...x, estado: nuevo } : x))
      );
      setSelectedUser((prev) =>
        prev && prev.id_usuario === u.id_usuario ? { ...prev, estado: nuevo } : prev
      );
      setMsg({ tipo: 'ok', texto: `${u.nombre} ${u.apellido}: estado cambiado a "${nuevo}"` });
    } catch (e) {
      setMsg({ tipo: 'error', texto: mensajeDeError(e, 'Error al cambiar el estado del usuario') });
    } finally {
      setCambiando(null);
    }
  };

  const formatearFecha = (f: string) =>
    new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

  const esSuperAdmin = (u: Usuario) =>
    (u.usuario_roles || []).some((ur) => ur.activo && ur.rol?.nombre === 'super_admin');

  const rolBadge = (u: Usuario) => {
    const activos = (u.usuario_roles || [])
      .filter((ur) => ur.activo)
      .map((ur) => ur.rol?.nombre)
      .filter(Boolean);
    const jerarquia = ['super_admin', 'sistemas', 'admin_contable', 'admin_comercial'];
    const rol =
      jerarquia.find((r) => activos.includes(r)) ||
      activos.find((r) => r !== 'cliente') ||
      activos[0] ||
      'sin_rol';
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
          placeholder="Buscar por nombre, apellido o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-lg text-sm ${
          msg.tipo === 'ok' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {msg.texto}
        </div>
      )}

      {selectedUser && (
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Detalle del Usuario</h2>
              <div className="flex items-center gap-2">
                {!(esSuperAdmin(selectedUser) && selectedUser.estado === 'activo') && (
                  <button
                    onClick={() => cambiarEstado(selectedUser)}
                    disabled={cambiando === selectedUser.id_usuario}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                      selectedUser.estado === 'activo'
                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                        : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'
                    }`}
                    title={selectedUser.estado === 'activo' ? 'Suspender usuario' : 'Activar usuario'}
                  >
                    {cambiando === selectedUser.id_usuario
                      ? '...'
                      : selectedUser.estado === 'activo'
                        ? 'Suspender usuario'
                        : 'Activar usuario'}
                  </button>
                )}
                <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
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

            <div className="pt-4 border-t border-slate-700 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Roles asignados</h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {(selectedUser.usuario_roles || [])
                  .filter((ur) => ur.activo)
                  .map((ur) => (
                    <span
                      key={ur.id_usuario_rol}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    >
                      {ur.rol?.nombre?.replace('_', ' ')}
                      <button
                        onClick={() => quitarRol(ur.id_rol, ur.rol?.nombre || '')}
                        disabled={guardandoRol}
                        className="hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Quitar rol"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                {!(selectedUser.usuario_roles || []).some((ur) => ur.activo) && (
                  <span className="text-xs text-slate-500">Sin roles asignados</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={nuevoRol}
                  onChange={(e) => setNuevoRol(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Seleccionar rol a asignar…</option>
                  {rolesCatalogo
                    .filter(
                      (r) =>
                        !(selectedUser.usuario_roles || []).some(
                          (ur) => ur.activo && ur.rol?.nombre === r.nombre
                        )
                    )
                    .map((r) => (
                      <option key={r.id_rol} value={r.nombre}>
                        {r.nombre.replace('_', ' ')}
                      </option>
                    ))}
                </select>
                <button
                  onClick={asignarRol}
                  disabled={guardandoRol || !nuevoRol}
                  className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {guardandoRol ? '...' : <Plus className="w-3.5 h-3.5" />}
                  Asignar
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

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
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    u.estado === 'activo' ? 'text-green-400 bg-green-500/10' :
                    u.estado === 'pendiente' ? 'text-yellow-400 bg-yellow-500/10' :
                    'text-slate-400 bg-slate-500/10'
                  }`}>
                    {u.estado}
                  </span>
                  <span className="text-xs text-slate-600">{formatearFecha(u.fecha_registro)}</span>
                </div>
                {!(esSuperAdmin(u) && u.estado === 'activo') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cambiarEstado(u);
                    }}
                    disabled={cambiando === u.id_usuario}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                      u.estado === 'activo'
                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                        : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'
                    }`}
                    title={u.estado === 'activo' ? 'Suspender usuario' : 'Activar usuario'}
                  >
                    {cambiando === u.id_usuario ? '...' : u.estado === 'activo' ? 'Suspender' : 'Reactivar'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
