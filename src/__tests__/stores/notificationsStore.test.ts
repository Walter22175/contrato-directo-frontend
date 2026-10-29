import { act } from '@testing-library/react';
import { useNotificationStore } from '@/store/notifications';
import api, { extractData } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    patch: jest.fn(),
  },
  extractData: jest.fn((response: { data: unknown }) => {
    const raw = response.data;
    if (raw && typeof raw === 'object' && 'data' in raw && 'timestamp' in raw) {
      return (raw as { data: unknown }).data;
    }
    return raw;
  }),
}));

const notificacion = {
  id_notificacion: 'notif-1',
  id_usuario: 'user-1',
  tipo: 'actividad',
  evento: 'nueva_solicitud_servicio',
  titulo: 'Nueva solicitud de servicio',
  mensaje: 'Walter solicitó tu servicio "Paseos"',
  canal: 'plataforma',
  leida: false,
  fecha_envio: '2026-10-27T16:33:43.275Z',
};

describe('useNotificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({ notificaciones: [], noLeidas: 0, isLoading: false });
    jest.clearAllMocks();
  });

  it('carga notificaciones desde una respuesta paginada { data, meta }', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        statusCode: 200,
        timestamp: '2026-10-27T16:33:44.000Z',
        data: { data: [notificacion], meta: { total: 1 } },
      },
    });

    await act(async () => {
      await useNotificationStore.getState().fetchNotificaciones();
    });

    expect(useNotificationStore.getState().notificaciones).toEqual([notificacion]);
    expect(useNotificationStore.getState().isLoading).toBe(false);
  });

  it('carga el contador de no leídas desde { data: { count } }', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        statusCode: 200,
        timestamp: '2026-10-27T16:33:44.000Z',
        data: { data: { count: 3 } },
      },
    });

    await act(async () => {
      await useNotificationStore.getState().fetchNoLeidas();
    });

    expect(useNotificationStore.getState().noLeidas).toBe(3);
  });

  it('sigue aceptando una lista plana como respuesta', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        statusCode: 200,
        timestamp: '2026-10-27T16:33:44.000Z',
        data: [notificacion],
      },
    });

    await act(async () => {
      await useNotificationStore.getState().fetchNotificaciones();
    });

    expect(useNotificationStore.getState().notificaciones).toEqual([notificacion]);
    expect(extractData).toHaveBeenCalled();
  });
});
