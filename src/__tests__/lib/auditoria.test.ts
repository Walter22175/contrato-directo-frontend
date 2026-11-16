/**
 * @jest-environment jsdom
 */
import { TextDecoder } from 'util';
import api from '@/lib/api';
import {
  descargarAuditoriaCsv,
  obtenerAuditoria,
  obtenerResumenAuditoria,
} from '@/lib/auditoria';
import type { AuditoriaLog } from '@/lib/auditoria';

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

describe('auditoria (cliente API)', () => {
  beforeEach(() => {
    getMock.mockReset();
    getMock.mockResolvedValue({
      data: {
        statusCode: 200,
        timestamp: '',
        data: { data: [], meta: { total: 0, page: 1, limit: 25, total_pages: 0 } },
      },
    });
  });

  it('obtenerAuditoria llama al endpoint del dashboard con filtros y paginación', async () => {
    await obtenerAuditoria({
      fecha_desde: '2026-11-01',
      fecha_hasta: '2026-11-16',
      resultado: 'denegado',
      search: 'login',
      page: 2,
      limit: 25,
    });

    expect(getMock).toHaveBeenCalledWith('/admin/dashboard/auditoria', {
      params: {
        fecha_desde: '2026-11-01',
        fecha_hasta: '2026-11-16',
        resultado: 'denegado',
        search: 'login',
        page: 2,
        limit: 25,
      },
    });
  });

  it('obtenerResumenAuditoria no envía paginación', async () => {
    await obtenerResumenAuditoria({
      fecha_desde: '2026-11-01',
      resultado: 'error',
      page: 3,
      limit: 50,
    });

    expect(getMock).toHaveBeenCalledWith('/admin/dashboard/auditoria/resumen', {
      params: { fecha_desde: '2026-11-01', resultado: 'error' },
    });
  });

  it('descargarAuditoriaCsv neutraliza fórmulas y agrega BOM', async () => {
    const blobs: Blob[] = [];
    const createObjectURL = jest.fn((blob: Blob) => {
      blobs.push(blob);
      return 'blob:auditoria';
    });
    const revokeObjectURL = jest.fn();
    const click = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;

    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;

    try {
      descargarAuditoriaCsv([
        {
          id: '1',
          user_id: null,
          rol_activo: null,
          accion: 'login_fallido',
          entidad: 'usuario',
          entidad_id: null,
          descripcion: '=1+1',
          metadata_json: null,
          ip: null,
          user_agent: null,
          request_id: null,
          resultado: 'error',
          created_at: '2026-11-16T12:00:00.000Z',
        } satisfies AuditoriaLog,
      ]);

      const bytes = await new Promise<Uint8Array>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(blobs[0]);
      });

      expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
      const texto = new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes);
      expect(texto).toContain(`"'=1+1"`);
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      click.mockRestore();
    }
  });
});
