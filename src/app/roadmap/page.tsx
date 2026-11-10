'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api, { extractData } from '@/lib/api';
import {
  CheckCircle2,
  Circle,
  Clock3,
  Flag,
  Loader2,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

type EstadoFase = 'completada' | 'en_curso' | 'planificada';
type EstadoRequisito = 'cumplido' | 'en_proceso' | 'pendiente';

interface Fase {
  id: string;
  nombre: string;
  estado: EstadoFase;
  descripcion: string;
  responsable: string;
  criterios_entrada: string[];
  criterios_salida: string[];
  evidencias: string[];
  fecha_objetivo?: string;
}

interface RequisitoFiscal {
  id: string;
  nombre: string;
  descripcion: string;
  estado: EstadoRequisito;
  responsable: string;
  evidencia?: string;
}

interface Roadmap {
  actualizado_en: string;
  version: string;
  fases: Fase[];
  requisitos_fiscales: RequisitoFiscal[];
}

const estadoFase: Record<
  EstadoFase,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  completada: {
    label: 'Completada',
    icon: CheckCircle2,
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  },
  en_curso: {
    label: 'En curso',
    icon: Clock3,
    className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  },
  planificada: {
    label: 'Planificada',
    icon: Circle,
    className: 'border-slate-600 bg-slate-800/60 text-slate-300',
  },
};

const estadoRequisito: Record<
  EstadoRequisito,
  { label: string; className: string }
> = {
  cumplido: {
    label: 'Cumplido',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  },
  en_proceso: {
    label: 'En proceso',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  },
  pendiente: {
    label: 'Pendiente',
    className: 'border-slate-600 bg-slate-800/60 text-slate-300',
  },
};

function formatearFecha(fecha: string): string {
  const parseada = new Date(fecha);
  if (Number.isNaN(parseada.getTime())) return fecha;
  return parseada.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelado = false;

    api
      .get('/roadmap')
      .then((res) => {
        const data = extractData<Roadmap | null>(res);
        if (!cancelado && data?.fases) setRoadmap(data);
      })
      .catch(() => {
        if (!cancelado) setError(true);
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-deep-indigo">
      <section className="border-b border-inkline-violet/60 bg-gradient-to-b from-inkline-violet/20 to-transparent">
        <div className="mx-auto max-w-[1100px] px-4 py-16 sm:px-6 lg:px-8">
          <p className="galileo-eyebrow text-signal-teal">Roadmap</p>
          <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">
            Hoja de ruta de la plataforma
          </h1>
          <p className="mt-4 max-w-2xl text-base font-light leading-relaxed text-quartz-lavender">
            Fases, responsables y criterios de cumplimiento de la expansión
            fiscal a productos. Publicamos el estado real de cada etapa para que
            clientes, proveedores y equipos internos sepan qué viene.
          </p>
          {roadmap && (
            <p className="mt-6 text-sm text-mist-lilac">
              Versión {roadmap.version} · Actualizado el{' '}
              {formatearFecha(roadmap.actualizado_en)}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-mist-lilac">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Cargando roadmap...
          </div>
        ) : error || !roadmap ? (
          <div className="rounded-2xl border border-inkline-violet bg-inkline-violet/10 p-8 text-center">
            <p className="text-quartz-lavender">
              No pudimos cargar el roadmap en este momento.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full border border-pulse-cobalt px-5 py-2 text-sm text-white transition-colors hover:bg-pulse-cobalt/20"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            <section>
              <h2 className="text-2xl font-semibold text-white">Fases</h2>
              <div className="mt-6 space-y-6">
                {roadmap.fases.map((fase, index) => {
                  const estado = estadoFase[fase.estado] ?? estadoFase.planificada;
                  const Icon = estado.icon;
                  return (
                    <article
                      key={fase.id}
                      className="rounded-2xl border border-inkline-violet/60 bg-inkline-violet/10 p-6 sm:p-8"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-4">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-inkline-violet text-sm font-semibold text-signal-teal">
                            {index + 1}
                          </span>
                          <div>
                            <h3 className="text-xl font-semibold text-white">
                              {fase.nombre}
                            </h3>
                            <p className="mt-1 flex items-center gap-1.5 text-sm text-mist-lilac">
                              <UserRound className="h-4 w-4" />
                              {fase.responsable}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${estado.className}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {estado.label}
                        </span>
                      </div>

                      <p className="mt-4 text-sm font-light leading-relaxed text-quartz-lavender">
                        {fase.descripcion}
                      </p>

                      <div className="mt-6 grid gap-6 sm:grid-cols-2">
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-signal-teal">
                            Criterios de entrada
                          </h4>
                          <ul className="mt-2 space-y-1.5 text-sm text-quartz-lavender">
                            {fase.criterios_entrada.map((criterio) => (
                              <li key={criterio} className="flex gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal-teal" />
                                {criterio}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-signal-teal">
                            Criterios de salida
                          </h4>
                          <ul className="mt-2 space-y-1.5 text-sm text-quartz-lavender">
                            {fase.criterios_salida.map((criterio) => (
                              <li key={criterio} className="flex gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal-teal" />
                                {criterio}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-inkline-violet/50 pt-4 text-xs text-mist-lilac">
                        <span className="inline-flex items-center gap-1.5">
                          <Flag className="h-3.5 w-3.5" />
                          Evidencias: {fase.evidencias.join(' · ')}
                        </span>
                        {fase.fecha_objetivo && (
                          <span>Objetivo: {formatearFecha(fase.fecha_objetivo)}</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-white">
                <ShieldCheck className="h-6 w-6 text-signal-teal" />
                Requisitos fiscales
              </h2>
              <p className="mt-2 text-sm text-quartz-lavender">
                Condiciones de cumplimiento que se verifican antes de habilitar
                cada fase.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {roadmap.requisitos_fiscales.map((requisito) => {
                  const estado =
                    estadoRequisito[requisito.estado] ??
                    estadoRequisito.pendiente;
                  return (
                    <div
                      key={requisito.id}
                      className="rounded-xl border border-inkline-violet/60 bg-inkline-violet/10 p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-medium text-white">
                          {requisito.nombre}
                        </h3>
                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs ${estado.className}`}
                        >
                          {estado.label}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-light text-quartz-lavender">
                        {requisito.descripcion}
                      </p>
                      <p className="mt-3 text-xs text-mist-lilac">
                        Responsable: {requisito.responsable}
                        {requisito.evidencia
                          ? ` · Evidencia: ${requisito.evidencia}`
                          : ''}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-inkline-violet/60 bg-inkline-violet/10 p-8 text-center">
              <h2 className="text-xl font-semibold text-white">
                ¿Tenés dudas sobre la expansión?
              </h2>
              <p className="mt-2 text-sm text-quartz-lavender">
                El Centro de Ayuda reúne las respuestas y los canales de
                contacto.
              </p>
              <Link
                href="/ayuda"
                className="mt-5 inline-flex rounded-full bg-pulse-cobalt px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-pulse-cobalt/80"
              >
                Ir al Centro de Ayuda
              </Link>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
