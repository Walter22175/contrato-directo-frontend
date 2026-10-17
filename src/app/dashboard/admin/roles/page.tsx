'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { KeyRound, Plus, Users, Loader2 } from 'lucide-react';
import type { Rol } from '@/types';

/** Espejo de RolNombreEnum del backend: el DTO de creación solo acepta estos valores. */
const NOMBRES_ROL = [
  'cliente',
  'proveedor',
  'super_admin',
  'sistemas',
  'admin_contable',
  'admin_comercial',
  'agente_atencion',
  'mediador',
] as const;

type ErrorApi = { response?: { data?: { message?: string } } };

const mensajeDeError = (error: unknown, fallback: string): string =>
  (error as ErrorApi | undefined)?.response?.data?.message || fallback;

type RespuestaApi<T> = T & { data?: T };

type RolConConteo = Rol & {
  permisos?: Record<string, unknown>;
  usuario_roles?: { activo?: boolean }[];
  usuariosActivos?: number;
};

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<RolConConteo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [permisosText, setPermisosText] = useState('{}');
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.get<RespuestaApi<RolConConteo[]>>('/roles');
      const data = extractData<RespuestaApi<RolConConteo[]> | null>(res);
      const lista = data?.data || data || [];
      const conConteo = await Promise.all(
        lista.map(async (r) => {
          try {
            const det = await api.get<RolConConteo>(`/roles/${r.id_rol}`);
            const detalle = extractData<RolConConteo | null>(det);
            const activos = detalle?.usuario_roles || [];
            return { ...r, usuariosActivos: activos.filter((ur) => ur.activo).length };
          } catch {
            return r;
          }
        }),
      );
      setRoles(conConteo);
    } catch {
      setRoles([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const disponibles = NOMBRES_ROL.filter((n) => !roles.some((r) => r.nombre === n));

  const crearRol = async () => {
    if (!nombre) return;
    let permisos: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(permisosText || '{}');
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setMsg({ tipo: 'error', texto: 'Los permisos deben ser un objeto JSON, por ejemplo {"tickets": true}' });
        return;
      }
      permisos = parsed as Record<string, unknown>;
    } catch {
      setMsg({ tipo: 'error', texto: 'Los permisos no son JSON válido' });
      return;
    }
    setGuardando(true);
    setMsg(null);
    try {
      await api.post('/roles', {
        nombre,
        descripcion: descripcion.trim() || undefined,
        permisos,
      });
      setMsg({ tipo: 'ok', texto: `Rol "${nombre.replace('_', ' ')}" creado correctamente` });
      setNombre('');
      setDescripcion('');
      setPermisosText('{}');
      await cargar();
    } catch (e) {
      setMsg({ tipo: 'error', texto: mensajeDeError(e, 'Error al crear el rol') });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Gestión de Roles</h1>
      </div>

      {msg && (
        <div
          className={`px-4 py-3 rounded-lg text-sm ${
            msg.tipo === 'ok'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {msg.texto}
        </div>
      )}

      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Agregar rol</h2>
          </div>

          {disponibles.length === 0 ? (
            <p className="text-sm text-slate-400">
              Todos los roles disponibles ya fueron creados. Los roles nuevos se
              habilitan desde el backend (enum de roles) y aparecen acá
              automáticamente.
            </p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1" htmlFor="rol-nombre">
                  Nombre del rol
                </label>
                <select
                  id="rol-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Seleccionar nombre…</option>
                  {disponibles.map((n) => (
                    <option key={n} value={n}>
                      {n.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1" htmlFor="rol-descripcion">
                  Descripción
                </label>
                <input
                  id="rol-descripcion"
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  maxLength={255}
                  placeholder="Qué hace este rol…"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1" htmlFor="rol-permisos">
                  Permisos (JSON)
                </label>
                <input
                  id="rol-permisos"
                  type="text"
                  value={permisosText}
                  onChange={(e) => setPermisosText(e.target.value)}
                  placeholder='{"mediacion": true}'
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          )}

          {disponibles.length > 0 && (
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={crearRol}
                disabled={!nombre || guardando}
                isLoading={guardando}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Crear rol
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Roles existentes</h2>
          </div>

          {cargando ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando roles…
            </div>
          ) : roles.length === 0 ? (
            <p className="text-sm text-slate-400">No hay roles creados.</p>
          ) : (
            <div className="space-y-2">
              {roles.map((r) => (
                <div
                  key={r.id_rol}
                  className="flex items-center gap-4 p-3 bg-slate-800/40 border border-slate-800 rounded-xl"
                >
                  <span className="text-xs px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                    {r.nombre.replace('_', ' ')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">
                      {r.descripcion || 'Sin descripción'}
                    </p>
                    {r.permisos && Object.keys(r.permisos).length > 0 && (
                      <p className="text-xs text-slate-500 font-mono truncate">
                        {JSON.stringify(r.permisos)}
                      </p>
                    )}
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-slate-400 flex-shrink-0">
                    <Users className="w-3.5 h-3.5" />
                    {r.usuariosActivos ?? '—'} usuario{(r.usuariosActivos ?? 0) === 1 ? '' : 's'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
