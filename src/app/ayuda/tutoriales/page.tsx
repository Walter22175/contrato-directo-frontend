'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, PlayCircle, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import api, { extractData, mensajeError } from '@/lib/api';
import type { Tutorial } from '@/types';

interface CategoriaTutorial {
  categoria: string;
  total: string | number;
}

function formatearDuracion(segundos?: number | null) {
  if (!segundos || segundos <= 0) return null;
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${minutos}:${String(resto).padStart(2, '0')} min`;
}

export default function TutorialesPage() {
  const [tutoriales, setTutoriales] = useState<Tutorial[]>([]);
  const [categorias, setCategorias] = useState<CategoriaTutorial[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<string>('');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarCategorias = useCallback(async () => {
    try {
      const res = await api.get('/centro-ayuda/tutoriales/categorias');
      setCategorias(extractData<CategoriaTutorial[]>(res) || []);
    } catch {
      setCategorias([]);
    }
  }, []);

  const cargarTutoriales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const termino = busqueda.trim();
      const res = termino
        ? await api.get('/centro-ayuda/tutoriales/buscar', { params: { q: termino } })
        : await api.get('/centro-ayuda/tutoriales', {
            params: categoriaActiva ? { categoria: categoriaActiva } : undefined,
          });
      setTutoriales(extractData<Tutorial[]>(res) || []);
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar los tutoriales.'));
      setTutoriales([]);
    } finally {
      setLoading(false);
    }
  }, [busqueda, categoriaActiva]);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  useEffect(() => {
    const timer = setTimeout(cargarTutoriales, 300);
    return () => clearTimeout(timer);
  }, [cargarTutoriales]);

  const categoriasVisibles = useMemo(
    () => categorias.filter((c) => Number(c.total) > 0),
    [categorias],
  );

  return (
    <main className="flex-1">
      <div className="border-b border-slate-800 bg-slate-900/50 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-4 flex items-center gap-3 text-sm text-slate-400">
            <Link href="/ayuda" className="transition-colors hover:text-cyan-400">
              Ayuda
            </Link>
            <span>/</span>
            <span className="text-white">Tutoriales</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-white">Tutoriales Paso a Paso</h1>
          <p className="text-slate-400">Aprende a usar Contrato Directo con nuestras guias</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-4">
          <Input
            placeholder="Buscar un tutorial..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar tutoriales"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoriaActiva('')}
              className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                categoriaActiva === ''
                  ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'
              }`}
            >
              Todas
            </button>
            {categoriasVisibles.map((categoria) => (
              <button
                key={categoria.categoria}
                type="button"
                onClick={() => setCategoriaActiva(categoria.categoria)}
                className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                  categoriaActiva === categoria.categoria
                    ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'
                }`}
              >
                {categoria.categoria} ({categoria.total})
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            Cargando tutoriales...
          </div>
        )}

        {!loading && error && (
          <Card>
            <div className="p-6 text-sm text-red-300">{error}</div>
          </Card>
        )}

        {!loading && !error && tutoriales.length === 0 && (
          <Card>
            <div className="flex flex-col items-center gap-3 p-10 text-center text-slate-400">
              <Search className="h-8 w-8 text-slate-500" />
              <p>No encontramos tutoriales para tu busqueda.</p>
              {(busqueda || categoriaActiva) && (
                <button
                  type="button"
                  className="text-sm text-cyan-400 hover:text-cyan-300"
                  onClick={() => {
                    setBusqueda('');
                    setCategoriaActiva('');
                  }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </Card>
        )}

        {!loading && !error && tutoriales.length > 0 && (
          <div className="space-y-5">
            {tutoriales.map((tutorial) => {
              const duracion = formatearDuracion(tutorial.duracion_segundos);
              return (
                <Card key={tutorial.id_tutorial}>
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                        {tutorial.tipo_contenido === 'video' ? (
                          <PlayCircle className="h-6 w-6 text-cyan-400" />
                        ) : (
                          <BookOpen className="h-6 w-6 text-cyan-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold text-white">{tutorial.titulo}</h2>
                          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                            {tutorial.categoria}
                          </span>
                        </div>
                        <p className="mb-4 whitespace-pre-line text-sm text-slate-400">
                          {tutorial.descripcion}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          {duracion && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {duracion}
                            </span>
                          )}
                          {tutorial.veces_visto > 0 && (
                            <span>{tutorial.veces_visto} visualizaciones</span>
                          )}
                          {tutorial.url_video && (
                            <a
                              href={tutorial.url_video}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                            >
                              <PlayCircle className="h-3.5 w-3.5" />
                              Ver tutorial
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
