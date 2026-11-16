/**
 * @jest-environment jsdom
 */
import './setup';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import api from '@/lib/api';
import AdminAuditoriaPage from '@/app/dashboard/admin/auditoria/page';

const log = {
  id: 'log-1',
  user_id: 'user-1',
  rol_activo: 'super_admin',
  accion: 'contrato_creado',
  entidad: 'contrato',
  entidad_id: 'contrato-1',
  descripcion: 'Creación de contrato',
  metadata_json: { id_transaccion: 'tx-1' },
  ip: '127.0.0.1',
  user_agent: 'jest',
  request_id: 'req-1',
  resultado: 'exito',
  created_at: '2026-11-16T12:00:00.000Z',
};

const getMock = api.get as jest.Mock;

function respuestaLista() {
  return {
    data: {
      statusCode: 200,
      timestamp: '',
      data: {
        data: [log],
        meta: { total: 1, page: 1, limit: 25, total_pages: 1 },
      },
    },
  };
}

function respuestaResumen() {
  return {
    data: {
      statusCode: 200,
      timestamp: '',
      data: {
        total: 1,
        errores: 0,
        denegados: 0,
        por_accion: [{ accion: 'contrato_creado', total: 1 }],
        por_entidad: [{ entidad: 'contrato', total: 1 }],
      },
    },
  };
}

describe('AdminAuditoriaPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getMock.mockImplementation((url: string) =>
      Promise.resolve(
        url.endsWith('/resumen') ? respuestaResumen() : respuestaLista(),
      ),
    );
  });

  it('muestra eventos y el resumen de auditoría', async () => {
    await act(async () => {
      render(<AdminAuditoriaPage />);
    });

    expect(screen.getByText('Auditoría')).toBeInTheDocument();
    const acciones = await screen.findAllByText('contrato_creado');
    const accion = acciones.find((elemento) => elemento.closest('tr'));
    expect(accion).toBeDefined();
    expect(screen.getByText('Creación de contrato')).toBeInTheDocument();
    const fila = accion?.closest('tr');
    expect(fila).not.toBeNull();
    expect(within(fila as HTMLElement).getByText('Éxito')).toBeInTheDocument();
  });

  it('aplica filtros y vuelve a la primera página', async () => {
    await act(async () => {
      render(<AdminAuditoriaPage />);
    });

    fireEvent.change(screen.getByLabelText('Búsqueda libre'), {
      target: { value: 'contrato' },
    });
    fireEvent.change(screen.getByLabelText('Resultado'), {
      target: { value: 'denegado' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Aplicar filtros/ }));
    });

    const llamadasLista = getMock.mock.calls.filter(
      ([url]) => url === '/admin/dashboard/auditoria',
    );
    expect(llamadasLista.length).toBeGreaterThanOrEqual(2);
    expect(llamadasLista[llamadasLista.length - 1][1]).toEqual({
      params: expect.objectContaining({
        search: 'contrato',
        resultado: 'denegado',
        page: 1,
        limit: 25,
      }),
    });
  });

  it('permite expandir el detalle de un evento', async () => {
    await act(async () => {
      render(<AdminAuditoriaPage />);
    });

    fireEvent.click(await screen.findByRole('button', { name: /^Ver$/ }));

    expect(screen.getByText(/req-1/)).toBeInTheDocument();
    expect(screen.getByText(/tx-1/)).toBeInTheDocument();
  });
});
