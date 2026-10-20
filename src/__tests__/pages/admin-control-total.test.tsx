/**
 * @jest-environment jsdom
 */
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import ControlTotalPage from '@/app/dashboard/admin/control-total/page';
import {
  obtenerResumenControlTotal,
  obtenerTimeline,
  obtenerMonitorColas,
  obtenerMonitorCrons,
  obtenerPanelTokens,
  obtenerPanelComisiones,
  obtenerPanelRetencion,
  obtenerInconsistencias,
  obtenerAuditoriaContable,
} from '@/lib/control-total';
import type { ResumenControlTotal, TimelineGlobal } from '@/lib/control-total';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
  useParams: () => ({}),
}));

const mockStore: {
  user: { usuario_roles: Array<{ activo: boolean; rol: { nombre: string } }> } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
} = {
  user: { usuario_roles: [{ activo: true, rol: { nombre: 'super_admin' } }] },
  isAuthenticated: true,
  isLoading: false,
};

jest.mock('@/store/auth', () => ({
  useAuthStore: Object.assign(
    jest.fn((selector?: (s: typeof mockStore) => unknown) =>
      selector ? selector(mockStore) : mockStore,
    ),
    { getState: jest.fn(() => mockStore) },
  ),
}));

jest.mock('@/lib/control-total', () => {
  const actual = jest.requireActual('@/lib/control-total');
  return {
    __esModule: true,
    ...actual,
    obtenerResumenControlTotal: jest.fn(),
    obtenerTimeline: jest.fn(),
    obtenerEspejo: jest.fn(),
    obtenerMonitorColas: jest.fn(),
    obtenerMonitorCrons: jest.fn(),
    obtenerPanelTokens: jest.fn(),
    obtenerPanelComisiones: jest.fn(),
    obtenerPanelRetencion: jest.fn(),
    obtenerInconsistencias: jest.fn(),
    obtenerAuditoriaContable: jest.fn(),
    obtenerInspector: jest.fn(),
  };
});

const RESUMEN: ResumenControlTotal = {
  generado_en: '2026-10-20T12:00:00Z',
  pagos_en_custodia: 5,
  eventos_24h: 42,
  errores_24h: 1,
  inconsistencias_criticas: 2,
  inconsistencias_totales: 7,
  modo_colas: 'inline',
  tokens_problema: 3,
  marketplace_habilitado: false,
  semaforo: 'amarillo',
};

const TIMELINE_VACIO: TimelineGlobal = {
  generado_en: '2026-10-20T12:00:00Z',
  total: 0,
  cursor: null,
  transacciones: [],
};

describe('ControlTotalPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.user = { usuario_roles: [{ activo: true, rol: { nombre: 'super_admin' } }] };
    mockStore.isAuthenticated = true;
    mockStore.isLoading = false;

    (obtenerResumenControlTotal as jest.Mock).mockResolvedValue(RESUMEN);
    (obtenerTimeline as jest.Mock).mockResolvedValue(TIMELINE_VACIO);
    (obtenerMonitorColas as jest.Mock).mockResolvedValue({
      modo: 'inline',
      colas: [],
      riesgos: {
        jobs_fallidos_24h: 0,
        jobs_sin_job_id_24h: 0,
        jobs_stuck: 0,
        jobs_duplicados_24h: 0,
        marcado_sin_encolar: 0,
        encolado_sin_marcado: 0,
        detalle: [],
      },
    });
    (obtenerMonitorCrons as jest.Mock).mockResolvedValue({ crons: [] });
    (obtenerPanelTokens as jest.Mock).mockResolvedValue({ generado_en: '', tokens: [] });
    (obtenerPanelComisiones as jest.Mock).mockResolvedValue({
      generado_en: '',
      desde: '',
      hasta: '',
      totales: {},
      por_periodo: [],
    });
    (obtenerPanelRetencion as jest.Mock).mockResolvedValue({
      generado_en: '',
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      contadores: {},
    });
    (obtenerInconsistencias as jest.Mock).mockResolvedValue([]);
    (obtenerAuditoriaContable as jest.Mock).mockResolvedValue({
      generado_en: '',
      desde: '',
      hasta: '',
      totales: {},
      por_periodo: [],
    });
  });

  it('redirige a /dashboard si el usuario no es super_admin', async () => {
    mockStore.user = { usuario_roles: [{ activo: true, rol: { nombre: 'cliente' } }] };
    const { container } = render(<ControlTotalPage />);

    expect(container.firstChild).toBeNull();
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'));
    expect(obtenerResumenControlTotal).not.toHaveBeenCalled();
  });

  it('redirige si no está autenticado', async () => {
    mockStore.isAuthenticated = false;
    render(<ControlTotalPage />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'));
  });

  it('renderiza el título, los KPIs, las 10 pestañas y el aviso de tokens', async () => {
    render(<ControlTotalPage />);

    expect(
      await screen.findByRole('heading', { name: 'Panel de Control Total' }),
    ).toBeInTheDocument();

    // KPIs del resumen
    expect(await screen.findByText('En custodia')).toBeInTheDocument();
    expect(screen.getByText('Eventos 24 h')).toBeInTheDocument();
    expect(screen.getByText('Tokens con problema')).toBeInTheDocument();
    expect(screen.getAllByText('5').length).toBeGreaterThan(0);

    // 10 pestañas
    for (const label of [
      'Timeline',
      'Espejo MP ↔ BD',
      'Colas',
      'Crons',
      'Tokens',
      'Comisiones',
      'Retención',
      'Inconsistencias',
      'Contabilidad',
      'Inspector',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }

    // Aviso de seguridad: nunca tokens
    expect(
      screen.getByText(/los tokens de mercado pago nunca se muestran/i),
    ).toBeInTheDocument();
  });

  it('cambia a la pestaña Colas y muestra el estado de las colas', async () => {
    (obtenerMonitorColas as jest.Mock).mockResolvedValue({
      modo: 'inline',
      colas: [
        {
          nombre: 'payments-capture',
          waiting: 0,
          active: 0,
          completed: 10,
          failed: 0,
          delayed: 0,
        },
      ],
      riesgos: {
        jobs_fallidos_24h: 0,
        jobs_sin_job_id_24h: 0,
        jobs_stuck: 0,
        jobs_duplicados_24h: 0,
        marcado_sin_encolar: 0,
        encolado_sin_marcado: 0,
        detalle: [],
      },
    });

    render(<ControlTotalPage />);
    await screen.findByRole('heading', { name: 'Panel de Control Total' });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Colas' }));
    });

    expect(obtenerMonitorColas).toHaveBeenCalled();
    expect(await screen.findByText('payments-capture')).toBeInTheDocument();
  });

  it('muestra la tarjeta de error cuando falla el resumen', async () => {
    (obtenerResumenControlTotal as jest.Mock).mockRejectedValueOnce(
      new Error('boom'),
    );

    render(<ControlTotalPage />);

    expect(await screen.findByText(/Resumen: boom/)).toBeInTheDocument();
  });

  it('hace polling del timeline mientras la pestaña está activa', async () => {
    render(<ControlTotalPage />);
    await screen.findByRole('heading', { name: 'Panel de Control Total' });

    await waitFor(() => expect(obtenerTimeline).toHaveBeenCalledWith({ limit: 300 }));
  });
});
