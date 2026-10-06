/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import api from '@/lib/api';
import MetricasPage from '@/app/dashboard/admin/metricas/page';

const respuestaVacia = { data: { statusCode: 200, timestamp: '', data: { data: [], meta: { total: 0 } } } };

describe('MetricasPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<MetricasPage />);
    });
    expect(screen.getByText('Métricas de Atención')).toBeInTheDocument();
  });

  it('renders SLA objectives section', async () => {
    await act(async () => {
      render(<MetricasPage />);
    });
    expect(screen.getByText('Objetivos de SLA')).toBeInTheDocument();
  });

  it('renders agent metrics section', async () => {
    await act(async () => {
      render(<MetricasPage />);
    });
    expect(screen.getByText('Métricas por Agente')).toBeInTheDocument();
  });
});

describe('MetricasPage — Objetivo 9', () => {
  const obj9 = {
    generado_en: '2026-10-06T00:00:00Z',
    metricas: [
      {
        clave: 'tiempo_promedio_resolucion',
        nombre: 'Tiempo promedio de resolución de reclamos',
        valor: 6.5,
        unidad: 'días hábiles',
        objetivo: '< 10 días hábiles desde la apertura hasta la resolución',
        cumple: true,
      },
      {
        clave: 'tasa_apelaciones',
        nombre: 'Tasa de apelaciones',
        valor: 20,
        unidad: '%',
        objetivo: '< 15% sobre el total de reclamos resueltos',
        cumple: false,
      },
      {
        clave: 'tasa_reincidencia',
        nombre: 'Tasa de reincidencia de usuarios',
        valor: 2,
        unidad: '%',
        objetivo: '< 5% de usuarios con más de 2 reclamos en contra en 6 meses',
        cumple: null,
      },
    ],
    cumplimiento: { metricas_evaluadas: 2, metricas_cumplen: 1, pct_cumplimiento: 50 },
    totales: {},
  };

  beforeEach(() => {
    (api.get as jest.Mock).mockImplementation((url: string) =>
      url === '/metricas/objetivo-9'
        ? Promise.resolve({ data: { statusCode: 200, timestamp: '', data: obj9 } })
        : Promise.resolve(respuestaVacia),
    );
  });

  afterEach(() => {
    (api.get as jest.Mock).mockImplementation(() => Promise.resolve(respuestaVacia));
  });

  it('renderiza la sección del Objetivo 9 con las métricas y su umbral', async () => {
    await act(async () => {
      render(<MetricasPage />);
    });

    expect(screen.getByText('Objetivo 9 — Mediación y Resolución de Reclamos')).toBeInTheDocument();
    expect(screen.getByText('Tiempo promedio de resolución de reclamos')).toBeInTheDocument();
    expect(screen.getByText('6.5 días hábiles')).toBeInTheDocument();
    expect(screen.getByText('< 10 días hábiles desde la apertura hasta la resolución')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('Tasa de apelaciones')).toBeInTheDocument();
    expect(
      screen.getByText('Cumplimiento: 1 de 2 métricas evaluadas (50%) · 3 métricas definidas'),
    ).toBeInTheDocument();
  });

  it('muestra mensaje de error cuando el endpoint no responde', async () => {
    (api.get as jest.Mock).mockImplementation(() => Promise.resolve(respuestaVacia));

    await act(async () => {
      render(<MetricasPage />);
    });

    expect(
      screen.getByText('No se pudieron cargar las métricas del Objetivo 9.'),
    ).toBeInTheDocument();
  });
});
