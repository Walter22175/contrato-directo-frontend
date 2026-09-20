'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useAuthStore } from '@/store/auth';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { User, Lock, FileText, Save, CheckCircle, AlertCircle } from 'lucide-react';

type Tab = 'perfil' | 'password' | 'datos';

interface Msg {
  type: 'success' | 'error';
  text: string;
}

export default function ConfiguracionPage() {
  const { user, loadUser } = useAuthStore();
  const [tab, setTab] = useState<Tab>('perfil');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<Msg | null>(null);

  const [perfil, setPerfil] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
  });

  const [password, setPassword] = useState({
    password_actual: '',
    password_nueva: '',
    password_confirm: '',
  });

  const [datos, setDatos] = useState({
    tipo_persona: 'fisica' as 'fisica' | 'juridica',
    cuit_cuil: '',
    dni: '',
    tipo_comercio: 'servicio' as 'servicio' | 'producto' | 'mixto',
    categoria_iva: 'no_categorizado' as 'responsable_inscripto' | 'monotributo' | 'no_categorizado',
  });

  useEffect(() => {
    if (user) {
      setPerfil({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        email: user.email || '',
        telefono: user.telefono || '',
        direccion: user.direccion || '',
      });
      setDatos({
        tipo_persona: (user.tipo_persona as any) || 'fisica',
        cuit_cuil: user.cuit_cuil || '',
        dni: user.dni || '',
        tipo_comercio: (user as any).tipo_comercio || 'servicio',
        categoria_iva: (user as any).categoria_iva || 'no_categorizado',
      });
    }
  }, [user]);

  const handlePerfil = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id_usuario) return;
    setSaving(true);
    setMsg(null);
    try {
      await api.patch(`/usuarios/${user.id_usuario}`, perfil);
      await loadUser();
      setMsg({ type: 'success', text: 'Perfil actualizado correctamente' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error al actualizar perfil' });
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id_usuario) return;
    if (password.password_nueva !== password.password_confirm) {
      setMsg({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await api.patch(`/usuarios/${user.id_usuario}/password`, {
        password_actual: password.password_actual,
        password_nueva: password.password_nueva,
      });
      setPassword({ password_actual: '', password_nueva: '', password_confirm: '' });
      setMsg({ type: 'success', text: 'Contraseña cambiada correctamente' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error al cambiar contraseña' });
    } finally {
      setSaving(false);
    }
  };

  const handleDatos = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id_usuario) return;
    setSaving(true);
    setMsg(null);
    try {
      await api.patch(`/usuarios/${user.id_usuario}`, datos);
      await loadUser();
      setMsg({ type: 'success', text: 'Datos fiscales actualizados' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error al actualizar datos' });
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'perfil', label: 'Perfil', icon: User },
    { id: 'password', label: 'Contraseña', icon: Lock },
    { id: 'datos', label: 'Datos Fiscales', icon: FileText },
  ];

  const inputCls = 'w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent';
  const labelCls = 'block text-sm font-medium text-slate-300 mb-1';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Configuración</h1>

      <div className="flex gap-1 border-b border-slate-700">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setMsg(null); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
          msg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {tab === 'perfil' && (
        <Card>
          <form onSubmit={handlePerfil} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nombre</label>
                <input className={inputCls} value={perfil.nombre} onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })} required />
              </div>
              <div>
                <label className={labelCls}>Apellido</label>
                <input className={inputCls} value={perfil.apellido} onChange={(e) => setPerfil({ ...perfil, apellido: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input className={inputCls} type="email" value={perfil.email} onChange={(e) => setPerfil({ ...perfil, email: e.target.value })} required />
              </div>
              <div>
                <label className={labelCls}>Teléfono</label>
                <input className={inputCls} value={perfil.telefono} onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Dirección</label>
              <input className={inputCls} value={perfil.direccion} onChange={(e) => setPerfil({ ...perfil, direccion: e.target.value })} />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </Card>
      )}

      {tab === 'password' && (
        <Card>
          <form onSubmit={handlePassword} className="p-6 space-y-4 max-w-md">
            <div>
              <label className={labelCls}>Contraseña Actual</label>
              <input className={inputCls} type="password" value={password.password_actual} onChange={(e) => setPassword({ ...password, password_actual: e.target.value })} required />
            </div>
            <div>
              <label className={labelCls}>Nueva Contraseña</label>
              <input className={inputCls} type="password" value={password.password_nueva} onChange={(e) => setPassword({ ...password, password_nueva: e.target.value })} required minLength={8} />
              <p className="mt-1 text-xs text-slate-500">Mínimo 8 caracteres, una mayúscula y un número</p>
            </div>
            <div>
              <label className={labelCls}>Confirmar Contraseña</label>
              <input className={inputCls} type="password" value={password.password_confirm} onChange={(e) => setPassword({ ...password, password_confirm: e.target.value })} required minLength={8} />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              <Lock className="w-4 h-4" />
              {saving ? 'Cambiando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        </Card>
      )}

      {tab === 'datos' && (
        <Card>
          <form onSubmit={handleDatos} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tipo de Persona</label>
                <select className={inputCls} value={datos.tipo_persona} onChange={(e) => setDatos({ ...datos, tipo_persona: e.target.value as any })}>
                  <option value="fisica">Persona Física</option>
                  <option value="juridica">Persona Jurídica</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>CUIT/CUIL</label>
                <input className={inputCls} value={datos.cuit_cuil} onChange={(e) => setDatos({ ...datos, cuit_cuil: e.target.value })} maxLength={11} placeholder="Ej: 20304050607" />
              </div>
              <div>
                <label className={labelCls}>DNI</label>
                <input className={inputCls} value={datos.dni} onChange={(e) => setDatos({ ...datos, dni: e.target.value })} maxLength={8} />
              </div>
              <div>
                <label className={labelCls}>Tipo de Comercio</label>
                <select className={inputCls} value={datos.tipo_comercio} onChange={(e) => setDatos({ ...datos, tipo_comercio: e.target.value as any })}>
                  <option value="servicio">Servicio</option>
                  <option value="producto">Producto</option>
                  <option value="mixto">Mixto</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Categoría IVA</label>
                <select className={inputCls} value={datos.categoria_iva} onChange={(e) => setDatos({ ...datos, categoria_iva: e.target.value as any })}>
                  <option value="responsable_inscripto">Responsable Inscripto</option>
                  <option value="monotributo">Monotributo</option>
                  <option value="no_categorizado">No Categorizado</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Datos'}
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}
