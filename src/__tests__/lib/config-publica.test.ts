import api from '@/lib/api';
import {
  obtenerConfigPublica,
  limpiarCacheConfigPublica,
  COMISION_FALLBACK,
  MONTO_EXPRESS_FALLBACK,
} from '@/lib/config-publica';

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
  extractData: (r: { data?: unknown }) => r?.data ?? r,
}));

const getMock = api.get as jest.Mock;

describe('config-publica', () => {
  beforeEach(() => {
    limpiarCacheConfigPublica();
    getMock.mockReset();
    getMock.mockResolvedValue({
      data: { comision_porcentaje: 12, monto_maximo_servicio_rapido: 250000 },
    });
  });

  it('devuelve los valores vigentes del backend', async () => {
    const cfg = await obtenerConfigPublica();
    expect(cfg).toEqual({
      comision_porcentaje: 12,
      monto_maximo_servicio_rapido: 250000,
    });
    expect(getMock).toHaveBeenCalledWith('/configuracion/publica');
  });

  it('cachea el resultado (una sola llamada)', async () => {
    await obtenerConfigPublica();
    await obtenerConfigPublica();
    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it('usa fallback si el backend responde vacío', async () => {
    getMock.mockResolvedValue({ data: null });
    const cfg = await obtenerConfigPublica();
    expect(cfg.comision_porcentaje).toBe(COMISION_FALLBACK);
    expect(cfg.monto_maximo_servicio_rapido).toBe(MONTO_EXPRESS_FALLBACK);
  });

  it('usa fallback si la petición falla', async () => {
    getMock.mockRejectedValue(new Error('red'));
    const cfg = await obtenerConfigPublica();
    expect(cfg.comision_porcentaje).toBe(COMISION_FALLBACK);
    expect(cfg.monto_maximo_servicio_rapido).toBe(MONTO_EXPRESS_FALLBACK);
  });

  it('limpiarCacheConfigPublica fuerza una nueva petición', async () => {
    await obtenerConfigPublica();
    limpiarCacheConfigPublica();
    await obtenerConfigPublica();
    expect(getMock).toHaveBeenCalledTimes(2);
  });
});
