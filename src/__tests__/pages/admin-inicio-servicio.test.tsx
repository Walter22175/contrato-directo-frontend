/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { obtenerMetricasInicioServicio } from '@/lib/mercadopago';
import InicioServicioAdminPage from '@/app/dashboard/admin/inicio-servicio/page';

jest.mock('@/lib/mercadopago', () => ({
  obtenerMetricasInicioServicio: jest.fn(),
}));

const metricas = {
  generado_en: '2026-10-17T12:00:00Z',
  inicio_servicio: {
    solo_notificacion: 2,
    ambas_notificaciones: 5,
    inicio_forzado: 1,
    tiempo_promedio_entre_notificaciones_horas: 18.5,
  },
  anticipo: {
    liberados: 3,
    pendientes: 1,
    no_aplicables: 4,
    monto_bruto_total: 9000,
    monto_neto_total: 8280,
    monto_descontado_en_liberaciones: 3000,
  },
  cron: {
    ultima_ejecucion: '2026-10-17T12:00:00Z',
    proxima_ejecucion: '2026-10-17T13:00:00Z',
    candidatas: 2,
    liberadas: 3,
    excluidas_hitos: 1,
    excluidas_retencion: 0,
  },
  alertas: {
    solo_notificacion_72h: [
      {
        id_transaccion: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        detalle: 'Solo una parte notificó el comienzo hace más de 72 horas calendario.',
      },
    ],
    demorados_por_horario: [],
    inconsistencias: [],
  },
  salud: 'atencion',
};

describe('InicioServicioAdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (obtenerMetricasInicioServicio as jest.Mock).mockResolvedValue(metricas);
  });

  it('renderiza el título y el indicador de salud', async () => {
    await act(async () => {
      render(<InicioServicioAdminPage />);
    });
    expect(
      screen.getByRole('heading', { name: /inicio del servicio y anticipo del 30%/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Requiere atención')).toBeInTheDocument();
  });

  it('muestra las secciones A, B y C con sus valores', async () => {
    await act(async () => {
      render(<InicioServicioAdminPage />);
    });
    expect(
      await screen.findByRole('heading', { name: 'Inicio del servicio' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Liberación anticipada del 30%')).toBeInTheDocument();
    expect(screen.getByText('Cron de anticipación')).toBeInTheDocument();

    expect(screen.getByText('Una sola notificación')).toBeInTheDocument();
    expect(screen.getByText('Ambas notificaciones')).toBeInTheDocument();
    expect(screen.getByText('Inicio forzado por admin')).toBeInTheDocument();
    expect(screen.getByText('18.5 h')).toBeInTheDocument();

    expect(screen.getByText('Anticipos liberados')).toBeInTheDocument();
    expect(screen.getByText('Anticipos pendientes')).toBeInTheDocument();
    expect(screen.getByText('No aplicables (< 3 días)')).toBeInTheDocument();
    expect(screen.getByText('Monto bruto anticipado')).toBeInTheDocument();
    expect(screen.getByText('Monto neto anticipado')).toBeInTheDocument();
    expect(
      screen.getByText('Descontado en liberaciones finales'),
    ).toBeInTheDocument();

    expect(screen.getByText('Candidatas ahora')).toBeInTheDocument();
    expect(screen.getByText('Liberadas (24 h)')).toBeInTheDocument();
    expect(screen.getByText('Excluidas por hitos')).toBeInTheDocument();
  });

  it('muestra la lista de alertas con el detalle', async () => {
    await act(async () => {
      render(<InicioServicioAdminPage />);
    });
    expect(
      await screen.findByText(/una sola notificación > 72 h \(1\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/solo una parte notificó el comienzo/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Anticipos demorados (0)')).toBeInTheDocument();
    expect(screen.getByText('Inconsistencias de datos (0)')).toBeInTheDocument();
  });

  it('aplica el filtro de rango de fechas', async () => {
    await act(async () => {
      render(<InicioServicioAdminPage />);
    });
    fireEvent.change(await screen.findByLabelText(/rango de creación desde/i), {
      target: { value: '2026-10-01' },
    });
    fireEvent.change(screen.getByLabelText(/^hasta/i), {
      target: { value: '2026-10-15' },
    });
    fireEvent.click(screen.getByRole('button', { name: /aplicar rango/i }));
    await act(async () => {});
    expect(obtenerMetricasInicioServicio).toHaveBeenLastCalledWith({
      desde: '2026-10-01T00:00:00.000Z',
      hasta: '2026-10-15T23:59:59.999Z',
    });
  });

  it('permite exportar CSV cuando hay datos', async () => {
    const click = jest.fn();
    const originalCreate = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      const el = originalCreate(tag);
      if (tag === 'a') {
        (el as HTMLAnchorElement).click = click;
      }
      return el;
    }) as typeof document.createElement);
    URL.createObjectURL = jest.fn(() => 'blob:csv');
    URL.revokeObjectURL = jest.fn();

    await act(async () => {
      render(<InicioServicioAdminPage />);
    });
    fireEvent.click(
      await screen.findByRole('button', { name: /exportar csv/i }),
    );
    expect(click).toHaveBeenCalled();

    (document.createElement as jest.Mock).mockRestore?.();
  });

  it('muestra error cuando falla la carga', async () => {
    (obtenerMetricasInicioServicio as jest.Mock).mockRejectedValueOnce(
      new Error('boom'),
    );
    await act(async () => {
      render(<InicioServicioAdminPage />);
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /no se pudieron cargar las métricas del anticipo/i,
    );
  });
});
