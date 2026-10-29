/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act, fireEvent } from '@testing-library/react';
import api from '@/lib/api';
import MisServiciosPage from '@/app/dashboard/mis-servicios/page';

describe('MisServiciosPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<MisServiciosPage />);
    });
    expect(screen.getByText('Mis Servicios')).toBeInTheDocument();
  });

  it('shows empty state initially', async () => {
    await act(async () => {
      render(<MisServiciosPage />);
    });
    expect(screen.getByText('Aún no tenés servicios asociados')).toBeInTheDocument();
  });

  it('lets the provider add an existing service from the catalog', async () => {
    const mockedGet = api.get as jest.Mock;
    mockedGet.mockImplementation((url: string) => {
      if (url === '/servicios') {
        return Promise.resolve({
          data: {
            statusCode: 200,
            timestamp: '',
            data: {
              data: [
                {
                  id_servicio: 5,
                  id_categoria: 1,
                  nombre: 'Plomería',
                  descripcion: 'Reparación de cañerías',
                  activo: true,
                  categoria: { id_categoria: 1, nombre: 'Hogar', activa: true, orden: 1 },
                },
              ],
              meta: { total: 1 },
            },
          },
        });
      }
      return Promise.resolve({ data: { statusCode: 200, timestamp: '', data: { data: [], meta: { total: 0 } } } });
    });

    await act(async () => {
      render(<MisServiciosPage />);
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('abrir-agregar-servicio'));
    });
    expect(screen.getByTestId('modal-agregar-servicio')).toBeInTheDocument();
    expect(screen.getByText('Plomería')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Plomería'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Agregar a mi muro'));
    });

    expect(api.post).toHaveBeenCalledWith('/servicios/mis-servicios', {
      id_servicio: 5,
      moneda: 'ARS',
    });
    expect(screen.queryByTestId('modal-agregar-servicio')).not.toBeInTheDocument();
  });

  it('pide confirmación antes de eliminar un servicio del muro y lo elimina al confirmar', async () => {
    const miServicio = {
      id_servicio_proveedor: 42,
      id_servicio: 5,
      nombre: 'Plomería',
      descripcion: 'Reparación de cañerías',
      categoria: 'Hogar',
      id_categoria: 1,
      moneda: 'ARS',
      disponible: true,
      fecha_creacion: '2026-01-01T00:00:00Z',
    };

    const mockedGet = api.get as jest.Mock;
    const lista = [miServicio];
    mockedGet.mockImplementation((url: string) => {
      if (url === '/servicios/mis-servicios') {
        return Promise.resolve({
          data: { statusCode: 200, timestamp: '', data: { data: lista, meta: { total: lista.length } } },
        });
      }
      return Promise.resolve({
        data: { statusCode: 200, timestamp: '', data: { data: [], meta: { total: 0 } } },
      });
    });
    (api.delete as jest.Mock).mockImplementation(() => {
      return Promise.resolve({ data: { statusCode: 200, timestamp: '', data: {} } });
    });

    await act(async () => {
      render(<MisServiciosPage />);
    });

    expect(await screen.findByText('Plomería')).toBeInTheDocument();

    // Abrir el diálogo de confirmación
    await act(async () => {
      fireEvent.click(screen.getByTestId('eliminar-servicio-42'));
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/¿Estás seguro de que querés eliminar "Plomería" de tu muro\?/)).toBeInTheDocument();

    // Cancelar: no se llama al backend
    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-cancel'));
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.delete).not.toHaveBeenCalled();

    // Reabrir y confirmar: se elimina
    await act(async () => {
      fireEvent.click(screen.getByTestId('eliminar-servicio-42'));
    });
    const fetchesBeforeDelete = mockedGet.mock.calls.filter(([url]) => url === '/servicios/mis-servicios').length;
    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-accept'));
    });

    expect(api.delete).toHaveBeenCalledWith('/servicios/asociacion/42');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await screen.findByText(/fue eliminado de tu muro/)).toBeInTheDocument();
    expect(screen.queryByText('Plomería')).not.toBeInTheDocument();
    expect(mockedGet.mock.calls.filter(([url]) => url === '/servicios/mis-servicios')).toHaveLength(fetchesBeforeDelete);
  });
});
