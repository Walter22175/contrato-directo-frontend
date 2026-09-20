'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Briefcase, Search, Plus, CheckCircle, Clock } from 'lucide-react';

interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion?: string;
  activa: boolean;
}

interface Servicio {
  id_servicio: number;
  nombre: string;
  id_categoria: number;
  activo: boolean;
}

export default function AdminServiciosPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'categorias' | 'servicios'>('categorias');
  const [busqueda, setBusqueda] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catsRes, servRes] = await Promise.allSettled([
        api.get('/catalogo/categorias'),
        api.get('/servicios'),
      ]);
      const catsData = catsRes.status === 'fulfilled' ? extractData<any>(catsRes.value) : null;
      const servData = servRes.status === 'fulfilled' ? extractData<any>(servRes.value) : null;
      setCategorias(catsData?.data || catsData || []);
      setServicios(servData?.data || servData || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const catsFiltradas = categorias.filter((c) =>
    !busqueda || c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const servFiltrados = servicios.filter((s) =>
    !busqueda || s.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Gestión de Servicios</h1>
      </div>

      <div className="flex gap-1 border-b border-slate-700">
        {(['categorias', 'servicios'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            {t === 'categorias' ? 'Categorías' : 'Servicios'}
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder={`Buscar ${tab}...`}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tab === 'categorias' ? (
        catsFiltradas.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No se encontraron categorías</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {catsFiltradas.map((c) => (
              <Card key={c.id_categoria}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">{c.nombre}</h3>
                      {c.descripcion && <p className="text-xs text-slate-500">{c.descripcion}</p>}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    c.activa ? 'text-green-400 bg-green-500/10' : 'text-slate-400 bg-slate-500/10'
                  }`}>
                    {c.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : servFiltrados.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No se encontraron servicios</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {servFiltrados.map((s) => (
            <Card key={s.id_servicio}>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">{s.nombre}</h3>
                    <p className="text-xs text-slate-500">Categoría #{s.id_categoria}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  s.activo ? 'text-green-400 bg-green-500/10' : 'text-slate-400 bg-slate-500/10'
                }`}>
                  {s.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
