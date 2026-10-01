/**
 * @jest-environment jsdom
 */
import api from '@/lib/api';
import { reportarBusquedaFallida } from '@/lib/catalogo';

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { post: jest.fn(() => Promise.resolve({ data: {} })) },
}));

const mockedPost = api.post as jest.Mock;

describe('reportarBusquedaFallida', () => {
  beforeEach(() => {
    mockedPost.mockClear();
    localStorage.clear();
  });

  it('posts the failed search payload', async () => {
    await reportarBusquedaFallida({ consulta: 'gasista matriculado', tipo: 'servicio' });
    expect(mockedPost).toHaveBeenCalledWith('/catalogo/busquedas-fallidas', {
      consulta: 'gasista matriculado',
      tipo: 'servicio',
    });
  });

  it('includes id_categoria when provided for rubro type', async () => {
    await reportarBusquedaFallida({ consulta: 'plomeria', tipo: 'rubro', id_categoria: 7 });
    expect(mockedPost).toHaveBeenCalledWith('/catalogo/busquedas-fallidas', {
      consulta: 'plomeria',
      tipo: 'rubro',
      id_categoria: 7,
    });
  });

  it('deduplicates the same query within the cooldown window', async () => {
    await reportarBusquedaFallida({ consulta: 'electricista', tipo: 'servicio' });
    await reportarBusquedaFallida({ consulta: 'electricista', tipo: 'servicio' });
    expect(mockedPost).toHaveBeenCalledTimes(1);
  });

  it('does not post empty queries', async () => {
    await reportarBusquedaFallida({ consulta: '   ', tipo: 'servicio' });
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('does not post queries longer than 150 chars', async () => {
    await reportarBusquedaFallida({ consulta: 'x'.repeat(151), tipo: 'servicio' });
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('swallows post errors silently', async () => {
    mockedPost.mockRejectedValueOnce(new Error('network down'));
    await expect(
      reportarBusquedaFallida({ consulta: 'algo', tipo: 'servicio' }),
    ).resolves.toBeUndefined();
  });
});
