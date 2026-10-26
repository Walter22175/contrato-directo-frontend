/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import api from '@/lib/api';
import ContratosPage from '@/app/dashboard/contratos/page';

const contratoPendiente = {
  id_contrato: 'uuid-test-12345678',
  id_transaccion: 'tx-1',
  tipo_contrato: 'servicio',
  incluye_iva: true,
  estado: 'pendiente_firma',
  fecha_generacion: '2026-01-01T00:00:00Z',
};

describe('ContratosPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page title', async () => {
    await act(async () => {
      render(<ContratosPage />);
    });
    expect(screen.getByText('Mis Contratos')).toBeInTheDocument();
  });

  it('renders subtitle', async () => {
    await act(async () => {
      render(<ContratosPage />);
    });
    expect(screen.getByText('Gestioná y firmá tus contratos digitales')).toBeInTheDocument();
  });

  it('shows empty state initially', async () => {
    await act(async () => {
      render(<ContratosPage />);
    });
    expect(screen.getByText('Sin contratos')).toBeInTheDocument();
  });

  it('ofrece ver detalle de cada contrato', async () => {
    (api.get as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        data: {
          statusCode: 200,
          timestamp: '',
          data: { data: [contratoPendiente], meta: { total: 1 } },
        },
      }),
    );

    await act(async () => {
      render(<ContratosPage />);
    });

    expect(await screen.findByText('Ver detalle')).toBeInTheDocument();
  });

  it('abre el modal de confirmación antes de firmar y no llama al endpoint hasta confirmar', async () => {
    (api.get as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        data: {
          statusCode: 200,
          timestamp: '',
          data: { data: [contratoPendiente], meta: { total: 1 } },
        },
      }),
    );

    await act(async () => {
      render(<ContratosPage />);
    });

    await act(async () => {
      fireEvent.click(await screen.findByText('Firmar'));
    });

    // El modal explica la evidencia y NO firmó todavía
    expect(screen.getByRole('dialog', { name: 'Confirmar firma' })).toBeInTheDocument();
    expect(
      screen.getByText(/hash SHA-256 del documento, fecha, IP y usuario autenticado/),
    ).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-accept'));
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/contratos/uuid-test-12345678/firmar', {
        proveedor_firma: 'docusign',
      });
    });
  });

  it('permite cancelar la firma desde el modal sin llamar al endpoint', async () => {
    (api.get as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        data: {
          statusCode: 200,
          timestamp: '',
          data: { data: [contratoPendiente], meta: { total: 1 } },
        },
      }),
    );

    await act(async () => {
      render(<ContratosPage />);
    });

    await act(async () => {
      fireEvent.click(await screen.findByText('Firmar'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-cancel'));
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
});
