/**
 * @jest-environment jsdom
 */
import api from '@/lib/api';
import {
  obtenerResumenControlTotal,
  obtenerTimeline,
  obtenerEspejo,
  obtenerMonitorColas,
  obtenerMonitorCrons,
  obtenerPanelTokens,
  obtenerPanelComisiones,
  obtenerPanelRetencion,
  obtenerInconsistencias,
  obtenerAuditoriaContable,
  obtenerInspector,
  fmtArs,
  fmtFecha,
  fmtNum,
  descargarCsv,
} from '@/lib/control-total';

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
  extractData: (r: { data?: unknown }) => {
    const raw = r?.data;
    if (raw && typeof raw === 'object' && 'data' in raw && 'timestamp' in raw) {
      return (raw as { data: unknown }).data;
    }
    return raw;
  },
}));

const getMock = api.get as jest.Mock;

describe('control-total (cliente API)', () => {
  beforeEach(() => {
    getMock.mockReset();
    getMock.mockResolvedValue({ data: {} });
  });

  it('obtenerResumenControlTotal llama GET /control-total/resumen', async () => {
    await obtenerResumenControlTotal();
    expect(getMock).toHaveBeenCalledWith('/control-total/resumen');
  });

  it('obtenerTimeline pasa los filtros como query params', async () => {
    await obtenerTimeline({
      desde: '2026-01-01',
      id_transaccion: 't1',
      tipo: 'webhook_recibido',
      limit: 50,
      cursor: 99,
    });
    expect(getMock).toHaveBeenCalledWith('/control-total/timeline', {
      params: {
        desde: '2026-01-01',
        id_transaccion: 't1',
        tipo: 'webhook_recibido',
        limit: 50,
        cursor: 99,
      },
    });
  });

  it('obtenerEspejo usa el id en la ruta', async () => {
    await obtenerEspejo('uuid-tx');
    expect(getMock).toHaveBeenCalledWith('/control-total/transacciones/uuid-tx/espejo');
  });

  it('obtenerInspector usa el id en la ruta', async () => {
    await obtenerInspector('uuid-tx');
    expect(getMock).toHaveBeenCalledWith(
      '/control-total/transacciones/uuid-tx/inspector',
    );
  });

  it('obtenerMonitorColas llama GET /control-total/colas', async () => {
    await obtenerMonitorColas();
    expect(getMock).toHaveBeenCalledWith('/control-total/colas');
  });

  it('obtenerMonitorCrons llama GET /control-total/crons', async () => {
    await obtenerMonitorCrons();
    expect(getMock).toHaveBeenCalledWith('/control-total/crons');
  });

  it('obtenerPanelTokens llama GET /control-total/tokens', async () => {
    await obtenerPanelTokens();
    expect(getMock).toHaveBeenCalledWith('/control-total/tokens');
  });

  it('obtenerPanelComisiones pasa rango y frecuencia', async () => {
    await obtenerPanelComisiones({ desde: '2026-01-01', frecuencia: 'mes' });
    expect(getMock).toHaveBeenCalledWith('/control-total/comisiones', {
      params: { desde: '2026-01-01', frecuencia: 'mes' },
    });
  });

  it('obtenerPanelRetencion pasa filtros y paginación', async () => {
    await obtenerPanelRetencion({ estado: 'EN_CUSTODIA', page: 2, limit: 25 });
    expect(getMock).toHaveBeenCalledWith('/control-total/retencion', {
      params: { estado: 'EN_CUSTODIA', page: 2, limit: 25 },
    });
  });

  it('obtenerInconsistencias llama GET /control-total/inconsistencias', async () => {
    await obtenerInconsistencias();
    expect(getMock).toHaveBeenCalledWith('/control-total/inconsistencias');
  });

  it('obtenerAuditoriaContable llama GET /control-total/contabilidad con params', async () => {
    await obtenerAuditoriaContable({ hasta: '2026-06-30', frecuencia: 'dia' });
    expect(getMock).toHaveBeenCalledWith('/control-total/contabilidad', {
      params: { hasta: '2026-06-30', frecuencia: 'dia' },
    });
  });

  it('desenvuelve el envelope { data, timestamp } del backend', async () => {
    getMock.mockResolvedValue({
      data: { statusCode: 200, timestamp: 'x', data: { semaforo: 'verde' } },
    });
    const r = await obtenerResumenControlTotal();
    expect(r).toEqual({ semaforo: 'verde' });
  });
});

describe('control-total (formatos)', () => {
  it('fmtArs formatea pesos y devuelve guion en null/undefined', () => {
    expect(fmtArs(1500)).toContain('1.500');
    expect(fmtArs(null)).toBe('—');
    expect(fmtArs(undefined)).toBe('—');
  });

  it('fmtNum formatea números y devuelve guion en null', () => {
    expect(fmtNum(1234567)).toContain('1.234.567');
    expect(fmtNum(null)).toBe('—');
  });

  it('fmtFecha devuelve guion en vacío o fecha inválida', () => {
    expect(fmtFecha(null)).toBe('—');
    expect(fmtFecha('no-es-fecha')).toBe('—');
    expect(fmtFecha('2026-01-15T12:00:00Z')).not.toBe('—');
  });
});

describe('control-total (descargarCsv)', () => {
  it('crea un blob, un enlace con descarga y lo revoca', () => {
    const click = jest.fn();
    const originalCreate = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      const el = originalCreate(tag);
      if (tag === 'a') (el as HTMLAnchorElement).click = click;
      return el;
    }) as typeof document.createElement);
    URL.createObjectURL = jest.fn(() => 'blob:csv');
    URL.revokeObjectURL = jest.fn();

    descargarCsv('control-total-timeline', ['a,b', '1,2']);

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:csv');
    const enlace = (document.createElement as unknown as jest.Mock).mock
      .results[0].value as HTMLAnchorElement;
    expect(enlace.download).toMatch(/^control-total-timeline-\d{4}-\d{2}-\d{2}\.csv$/);

    (document.createElement as jest.Mock).mockRestore?.();
  });
});
