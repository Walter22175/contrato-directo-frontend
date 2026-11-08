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
  obtenerInteligenciaEmail,
  obtenerInteligenciaOperativa,
  obtenerAlertas,
  reconocerAlerta,
  resolverAlerta,
  descartarAlerta,
  obtenerEventosEmail,
  obtenerMetricasPlantillasEmail,
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
    obtenerInteligenciaEmail: jest.fn(),
    obtenerInteligenciaOperativa: jest.fn(),
    obtenerAlertas: jest.fn(),
    reconocerAlerta: jest.fn(),
    resolverAlerta: jest.fn(),
    descartarAlerta: jest.fn(),
    obtenerEventosEmail: jest.fn(),
    obtenerMetricasPlantillasEmail: jest.fn(),
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
    (obtenerInteligenciaEmail as jest.Mock).mockResolvedValue({
      generado_en: '2026-11-02T12:00:00Z',
      rango: '30d',
      desde: '2026-10-03T12:00:00Z',
      hasta: '2026-11-02T12:00:00Z',
      bucket: 'day',
      resumen: {
        generado_en: '2026-11-02T12:00:00Z',
        desde: '2026-10-03T12:00:00Z',
        hasta: '2026-11-02T12:00:00Z',
        total_eventos: 0,
        enviados: 0,
        entregados: 0,
        rebotes: 0,
        quejas: 0,
        rechazados: 0,
        aperturas: 0,
        clicks: 0,
        tasa_entrega: 0,
        tasa_rebote: 0,
        tasa_queja: 0,
        tasa_apertura: 0,
        tasa_click: 0,
        ctr: 0,
        semaforo: 'gris',
      },
      tendencia: [],
      alertas: [],
    });
    (obtenerEventosEmail as jest.Mock).mockResolvedValue({
      generado_en: '',
      data: [],
      meta: { total: 0, limit: 50 },
    });
    (obtenerMetricasPlantillasEmail as jest.Mock).mockResolvedValue({
      generado_en: '',
      desde: null,
      hasta: null,
      templates: [],
    });
    (obtenerAlertas as jest.Mock).mockResolvedValue({
      critical: [],
      high: [],
      medium: [],
      low: [],
      info: [],
      stats: { open: 0, acknowledged: 0, resolved: 0 },
    });
    (reconocerAlerta as jest.Mock).mockResolvedValue({});
    (resolverAlerta as jest.Mock).mockResolvedValue({});
    (descartarAlerta as jest.Mock).mockResolvedValue({});
    (obtenerInteligenciaOperativa as jest.Mock).mockResolvedValue({
      generado_en: '2026-11-08T12:00:00Z',
      health: {
        generado_en: '2026-11-08T12:00:00Z',
        estado: 'amarillo',
        checks: [
          {
            codigo: 'email_bounce',
            etiqueta: 'Bounce Rate',
            valor: 2,
            umbral: '< 1%',
            estado: 'amarillo',
            detalle: '2 rebotes sobre 100 envíos (24 h).',
          },
        ],
        metricas: {
          bounce_rate: 2,
          complaint_rate: 0,
          jobs_stuck: 1,
          jobs_fallidos_24h: 0,
          errores_24h: 3,
          crons_detenidos: 0,
          crons_con_fallos_24h: 0,
        },
      },
      email: {
        generado_en: '2026-11-08T12:00:00Z',
        rango: '30d',
        resumen: {
          generado_en: '2026-11-08T12:00:00Z',
          desde: '2026-10-09T12:00:00Z',
          hasta: '2026-11-08T12:00:00Z',
          total_eventos: 248,
          enviados: 100,
          entregados: 98,
          rebotes: 2,
          quejas: 0,
          rechazados: 0,
          aperturas: 40,
          clicks: 8,
          tasa_entrega: 98,
          tasa_rebote: 2,
          tasa_queja: 0,
          tasa_apertura: 40.82,
          tasa_click: 8.16,
          ctr: 20,
          semaforo: 'amarillo',
        },
        tendencia: [],
        alertas_email: [],
        ranking: {
          top_ctr: [
            {
              template: 'contract-created',
              enviados: 10,
              entregados: 10,
              aperturas: 5,
              clicks: 2,
              tasa_apertura: 50,
              ctr: 40,
              tasa_rebote: 0,
              tasa_queja: 0,
            },
          ],
          top_open_rate: [],
          top_bounce: [],
          peores: [],
        },
      },
      contracts: {
        generado_en: '2026-11-08T12:00:00Z',
        total: 1,
        ranking: [],
        top_activos: [
          {
            contratoId: 'contrato-1',
            id_transaccion: 'tx-1',
            estado: 'firmado',
            fecha_creacion: '2026-11-01T12:00:00Z',
            fecha_fin_servicio: '2026-11-10T12:00:00Z',
            dias_para_vencer: 2,
            actividadScore: 9,
            eventos: 4,
            mensajes: 2,
            versiones: 1,
            modificaciones: 0,
            id_cliente: 'u-1',
            id_proveedor: 'u-2',
          },
        ],
        top_mensajes: [],
        top_versiones: [],
        top_modificaciones: [],
        proximos_a_vencer: [
          {
            contratoId: 'contrato-1',
            id_transaccion: 'tx-1',
            estado: 'firmado',
            fecha_creacion: '2026-11-01T12:00:00Z',
            fecha_fin_servicio: '2026-11-10T12:00:00Z',
            dias_para_vencer: 2,
            actividadScore: 9,
            eventos: 4,
            mensajes: 2,
            versiones: 1,
            modificaciones: 0,
            id_cliente: 'u-1',
            id_proveedor: 'u-2',
          },
        ],
      },
      users: {
        generado_en: '2026-11-08T12:00:00Z',
        top_activos: [
          {
            id_usuario: 'u-1',
            email: 'admin@test.com',
            nombre: 'Admin',
            apellido: null,
            contratos: 2,
            mensajes: 3,
            logins: 4,
            ultimo_acceso: '2026-11-08T10:00:00Z',
            actividadScore: 11,
          },
        ],
        top_contratos: [],
        top_mensajes: [],
        top_logins: [],
      },
      security: {
        generado_en: '2026-11-08T12:00:00Z',
        intentos_fallidos_24h: 7,
        intentos_fallidos_7d: 30,
        alertas_24h: 1,
        alertas_7d: 3,
        ips_sospechosas: [
          {
            ip_hash: 'abcdef1234567890',
            intentos: 12,
            emails: 4,
            alertas: 1,
            ultima_actividad: '2026-11-08T10:00:00Z',
          },
        ],
        usuarios_intentos_fallidos: [],
      },
      alerts: [
        {
          id: 'EMAIL_BOUNCE:global',
          tipo: 'EMAIL_BOUNCE',
          prioridad: 'high',
          titulo: 'Bounce Rate elevado',
          detalle: 'La tasa de rebote (2%) supera el umbral recomendado de 1%.',
          valor: 2,
          umbral: 1,
          entidad: null,
        },
      ],
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

  it('renderiza el título, los KPIs, las 12 pestañas y el aviso de tokens', async () => {
    render(<ControlTotalPage />);

    expect(
      await screen.findByRole('heading', { name: 'Panel de Control Total' }),
    ).toBeInTheDocument();

    // KPIs del resumen
    expect(await screen.findByText('En custodia')).toBeInTheDocument();
    expect(screen.getByText('Eventos 24 h')).toBeInTheDocument();
    expect(screen.getByText('Tokens con problema')).toBeInTheDocument();
    expect(screen.getAllByText('5').length).toBeGreaterThan(0);

    // 12 pestañas
    for (const label of [
      'Inteligencia',
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
      'Email',
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
    expect((await screen.findAllByText('payments-capture')).length).toBeGreaterThan(0);
  });

  it('cambia a la pestaña Email y muestra los KPIs de entregabilidad', async () => {
    (obtenerInteligenciaEmail as jest.Mock).mockResolvedValue({
      generado_en: '2026-11-02T12:00:00Z',
      rango: '30d',
      desde: '2026-10-03T12:00:00Z',
      hasta: '2026-11-02T12:00:00Z',
      bucket: 'day',
      resumen: {
        generado_en: '2026-11-02T12:00:00Z',
        desde: '2026-10-03T12:00:00Z',
        hasta: '2026-11-02T12:00:00Z',
        total_eventos: 248,
        enviados: 100,
        entregados: 98,
        rebotes: 1,
        quejas: 0,
        rechazados: 1,
        aperturas: 40,
        clicks: 8,
        tasa_entrega: 98,
        tasa_rebote: 1,
        tasa_queja: 0,
        tasa_apertura: 40.82,
        tasa_click: 8.16,
        ctr: 20,
        semaforo: 'amarillo',
      },
      tendencia: [
        {
          fecha: '2026-11-02T00:00:00Z',
          enviados: 10,
          entregados: 9,
          rebotes: 1,
          quejas: 0,
          rechazados: 0,
          aperturas: 4,
          clicks: 1,
          tasa_entrega: 90,
          tasa_rebote: 10,
          tasa_queja: 0,
          tasa_apertura: 44.44,
          tasa_click: 11.11,
          ctr: 25,
        },
      ],
      alertas: [
        {
          codigo: 'rebote_alto',
          severidad: 'alta',
          titulo: 'Tasa de rebote alta',
          detalle: 'La tasa de rebote es 10% y supera el límite de 5%.',
          valor: 10,
          limite: 5,
          operador: '>',
        },
      ],
    });
    (obtenerEventosEmail as jest.Mock).mockResolvedValue({
      generado_en: '',
      data: [
        {
          id: 'evt-1',
          message_id: 'ses-1',
          recipient_email: 'user@test.com',
          event_type: 'delivery',
          template: 'contract-created',
          provider: 'ses',
          metadata: null,
          created_at: '2026-11-02T12:00:00Z',
        },
      ],
      meta: { total: 1, limit: 50 },
    });
    (obtenerMetricasPlantillasEmail as jest.Mock).mockResolvedValue({
      generado_en: '',
      desde: null,
      hasta: null,
      templates: [
        {
          template: 'contract-created',
          total_eventos: 10,
          enviados: 10,
          entregados: 9,
          rebotes: 1,
          quejas: 0,
          rechazados: 0,
          aperturas: 5,
          clicks: 2,
          tasa_entrega: 90,
          tasa_rebote: 10,
          tasa_apertura: 55.56,
          tasa_click: 22.22,
          ctr: 40,
        },
      ],
    });

    render(<ControlTotalPage />);
    await screen.findByRole('heading', { name: 'Panel de Control Total' });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Email' }));
    });

    expect(obtenerInteligenciaEmail).toHaveBeenCalledWith({ rango: '30d' });
    expect(obtenerEventosEmail).toHaveBeenCalledWith({
      desde: '2026-10-03T12:00:00Z',
      hasta: '2026-11-02T12:00:00Z',
      limit: 50,
    });
    expect(obtenerMetricasPlantillasEmail).toHaveBeenCalledWith({
      desde: '2026-10-03T12:00:00Z',
      hasta: '2026-11-02T12:00:00Z',
    });
    expect(await screen.findByText('Entregabilidad SES')).toBeInTheDocument();
    expect((await screen.findAllByText('Enviados')).length).toBeGreaterThan(0);
    expect(await screen.findByText('Engagement')).toBeInTheDocument();
    expect(await screen.findByText('Reputación')).toBeInTheDocument();
    expect(await screen.findByText('Tendencias')).toBeInTheDocument();
    expect(await screen.findByText('Alertas automáticas')).toBeInTheDocument();
    expect(await screen.findByText('Tasa de rebote alta')).toBeInTheDocument();
    expect((await screen.findAllByText('Open Rate')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/40[.,]82%/)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/55[.,]56%/)).length).toBeGreaterThan(0);
    expect(await screen.findByText('user@test.com')).toBeInTheDocument();
    expect((await screen.findAllByText('contract-created')).length).toBeGreaterThan(0);
  });

  it('cambia a la pestaña Inteligencia y muestra salud, alertas y rankings', async () => {
    render(<ControlTotalPage />);
    await screen.findByRole('heading', { name: 'Panel de Control Total' });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Inteligencia' }));
    });

    expect(obtenerInteligenciaOperativa).toHaveBeenCalled();
    expect(await screen.findByText('Salud del Sistema')).toBeInTheDocument();
    expect(await screen.findByText('Alertas de riesgo')).toBeInTheDocument();
    expect(await screen.findByText('Bounce Rate elevado')).toBeInTheDocument();
    expect(await screen.findByText('Inteligencia de Email')).toBeInTheDocument();
    expect(await screen.findByText('Inteligencia de Contratos')).toBeInTheDocument();
    expect(await screen.findByText('Inteligencia de Usuarios')).toBeInTheDocument();
    expect(await screen.findByText('Inteligencia de Seguridad')).toBeInTheDocument();
    expect(await screen.findByText('score 9')).toBeInTheDocument();
    expect((await screen.findAllByText('admin@test.com')).length).toBeGreaterThan(0);
  });

  it('ubica Inteligencia y Alertas al final del menu de pestañas', async () => {
    render(<ControlTotalPage />);
    await screen.findByRole('heading', { name: 'Panel de Control Total' });

    const buscadas = ['Timeline', 'Email', 'Inteligencia', 'Alertas'];
    const etiquetas = Array.from(document.querySelectorAll('button'))
      .map((boton) => boton.textContent?.trim() ?? '')
      .filter((etiqueta) => buscadas.includes(etiqueta));

    expect(etiquetas).toEqual(buscadas);
  });

  it('cambia a la pestaña Alertas y permite reconocer una alerta', async () => {
    const alerta = {
      id: '11111111-1111-4111-8111-111111111111',
      type: 'CRON_INACTIVE',
      severity: 'CRITICAL',
      status: 'OPEN',
      title: 'Cron inactivo: mp-captura-cron',
      description: 'El cron no se ejecuta desde hace más de dos períodos.',
      source: 'cron:mp-captura-cron',
      metadata: null,
      notification_channels: null,
      first_detected_at: '2026-11-08T10:00:00Z',
      last_detected_at: '2026-11-08T10:00:00Z',
      resolved_at: null,
      acknowledged_by: null,
      acknowledged_at: null,
      created_at: '2026-11-08T10:00:00Z',
      updated_at: '2026-11-08T10:00:00Z',
    };
    (obtenerAlertas as jest.Mock).mockResolvedValue({
      critical: [alerta],
      high: [],
      medium: [],
      low: [],
      info: [],
      stats: { open: 1, acknowledged: 0, resolved: 0 },
    });

    render(<ControlTotalPage />);
    await screen.findByRole('heading', { name: 'Panel de Control Total' });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Alertas' }));
    });

    expect(obtenerAlertas).toHaveBeenCalled();
    expect(await screen.findByText('Alert Center')).toBeInTheDocument();
    expect(await screen.findByText('Cron inactivo: mp-captura-cron')).toBeInTheDocument();
    expect(await screen.findByText('Severidad')).toBeInTheDocument();
    expect(await screen.findByText('Detectada')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Reconocer' }));
    });

    expect(reconocerAlerta).toHaveBeenCalledWith(alerta.id);
  });

  it('recarga la inteligencia al cambiar el rango de tendencia', async () => {
    render(<ControlTotalPage />);
    await screen.findByRole('heading', { name: 'Panel de Control Total' });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Email' }));
    });
    await screen.findByText('Tendencias');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '7 días' }));
    });

    await waitFor(() =>
      expect(obtenerInteligenciaEmail).toHaveBeenCalledWith({ rango: '7d' }),
    );
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
