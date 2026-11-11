/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import api from '@/lib/api';
import ReporteTrimestralPage from '@/app/dashboard/admin/reportes/trimestral/page';

const reporte = {
  id_reporte: 'r1',
  tipo: 'trimestral',
  periodo: '2026-T3',
  fecha_generacion: '2026-10-01T03:30:00.000Z',
  generado_por: 'admin@test.com',
  datos: {
    desde: '2026-07-01T00:00:00.000Z',
    hasta: '2026-10-01T00:00:00.000Z',
    tickets: {
      creados: 120,
      resueltos: 110,
      tpr_promedio_min: 12,
      tr_promedio_min: 90,
    },
    por_canal: [
      {
        canal: 'whatsapp',
        creados: 80,
        resueltos: 75,
        tpr_promedio_min: 10,
        tr_promedio_min: 60,
      },
    ],
    sla: {
      total: 100,
      cumplidos: 95,
      incumplidos: 5,
      pct_cumplimiento: 95,
    },
    encuestas: {
      respondidas: 40,
      csat: 4.7,
      nps: 70,
      fcr: 85,
    },
    autoservicio: {
      uso_centro_ayuda: 65,
      derivacion_chatbot: 30,
    },
    temas_frecuentes: [{ tema: 'Problemas con pagos', cantidad: 25 }],
  },
};

const ediciones = [
  {
    id_edicion: 1,
    id_revision: 10,
    id_categoria: 5,
    periodo: '2026-Q3',
    accion: 'rubro_baja_demanda',
    detalle: { nombre: 'Electricidad' },
    fecha_creacion: '2026-10-02T00:00:00.000Z',
  },
];

describe('ReporteTrimestralPage', () => {
  beforeEach(() => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/catalogo/ediciones-trimestrales')) {
        return Promise.resolve({
          data: { statusCode: 200, timestamp: '', data: ediciones },
        });
      }
      return Promise.resolve({
        data: { statusCode: 200, timestamp: '', data: [reporte] },
      });
    });
  });

  afterEach(() => {
    (api.get as jest.Mock).mockReset();
  });

  it('renders the page title', async () => {
    await act(async () => {
      render(<ReporteTrimestralPage />);
    });
    expect(screen.getByText('Reporte Trimestral')).toBeInTheDocument();
    expect(screen.getByText('Q3 2026')).toBeInTheDocument();
  });

  it('renders frequent topics section', async () => {
    await act(async () => {
      render(<ReporteTrimestralPage />);
    });
    expect(screen.getByText('Temas de Consulta Más Frecuentes')).toBeInTheDocument();
    expect(screen.getByText('Problemas con pagos')).toBeInTheDocument();
  });

  it('renders improvement areas section', async () => {
    await act(async () => {
      render(<ReporteTrimestralPage />);
    });
    expect(screen.getByText('Áreas de Mejora Identificadas')).toBeInTheDocument();
  });

  it('renders catalog editions for the same quarter', async () => {
    await act(async () => {
      render(<ReporteTrimestralPage />);
    });
    expect(screen.getByText('Ediciones del Catálogo (OE5)')).toBeInTheDocument();
    expect(screen.getByText('Electricidad')).toBeInTheDocument();
    expect(screen.getByText('Rubro con baja demanda')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/catalogo/ediciones-trimestrales', {
      params: { periodo: '2026-Q3' },
    });
  });

  it('shows an empty state when no report exists', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: { statusCode: 200, timestamp: '', data: [] },
    });

    await act(async () => {
      render(<ReporteTrimestralPage />);
    });

    expect(
      screen.getByText('No hay reporte trimestral generado'),
    ).toBeInTheDocument();
  });
});
