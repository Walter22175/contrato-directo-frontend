/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import api from '@/lib/api';
import ContratoDetallePage from '@/app/dashboard/contratos/[id]/page-client';

const contratoPendiente = {
  id_contrato: 'uuid-test-12345678',
  id_transaccion: 'tx-1',
  tipo_contrato: 'servicio',
  incluye_iva: true,
  estado: 'pendiente_firma',
  fecha_generacion: '2026-01-01T00:00:00Z',
  hash_documento: 'abc123hashsha256',
  firmas: [],
};

function mockGetContrato(contrato: Record<string, unknown>) {
  (api.get as jest.Mock).mockImplementation(() =>
    Promise.resolve({
      data: { statusCode: 200, timestamp: '', data: contrato },
    }),
  );
}

describe('ContratoDetallePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra el detalle del contrato con su hash', async () => {
    mockGetContrato(contratoPendiente);

    await act(async () => {
      render(<ContratoDetallePage />);
    });

    expect(await screen.findByText('Contrato #uuid-tes')).toBeInTheDocument();
    expect(screen.getByText('pendiente firma')).toBeInTheDocument();
    expect(screen.getByText('abc123hashsha256')).toBeInTheDocument();
  });

  it('ofrece firmar electrónicamente con modal de confirmación', async () => {
    mockGetContrato(contratoPendiente);

    await act(async () => {
      render(<ContratoDetallePage />);
    });

    await act(async () => {
      fireEvent.click(await screen.findByText('Firmar electrónicamente'));
    });

    expect(screen.getByRole('dialog', { name: 'Confirmar firma' })).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();

    (api.post as jest.Mock).mockResolvedValue({
      data: {
        statusCode: 201,
        timestamp: '',
        data: {
          id_firma: 'firma-1',
          id_contrato: 'uuid-test-12345678',
          id_usuario: 'test-user-id',
          proveedor_firma: 'docusign',
          fecha_firma: '2026-10-26T12:00:00Z',
          ip_firma: '127.0.0.1',
          hash_documento: 'abc123hashsha256',
          estado: 'exitosa',
        },
      },
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-accept'));
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/contratos/test-id/firmar', {
        proveedor_firma: 'docusign',
      });
    });

    // Pantalla de éxito integrada con evidencia
    expect(await screen.findByText('Contrato firmado correctamente')).toBeInTheDocument();
    expect(screen.getByText(/Se registró tu firma electrónica y se envió un email/)).toBeInTheDocument();
    expect(screen.getByText(/127\.0\.0\.1/)).toBeInTheDocument();
  });

  it('no ofrece firmar si el contrato ya está firmado', async () => {
    mockGetContrato({ ...contratoPendiente, estado: 'firmado' });

    await act(async () => {
      render(<ContratoDetallePage />);
    });

    expect(await screen.findByText('Este contrato fue firmado por ambas partes.')).toBeInTheDocument();
    expect(screen.queryByText('Firmar electrónicamente')).not.toBeInTheDocument();
  });

  it('indica que el usuario ya firmó cuando su firma está registrada', async () => {
    mockGetContrato({
      ...contratoPendiente,
      firmas: [
        {
          id_firma: 'f-1',
          id_contrato: 'uuid-test-12345678',
          id_usuario: 'test-user-id',
          proveedor_firma: 'docusign',
          fecha_firma: '2026-10-26T12:00:00Z',
          estado: 'exitosa',
        },
      ],
    });

    await act(async () => {
      render(<ContratoDetallePage />);
    });

    expect(
      await screen.findByText('Ya firmaste este contrato. Esperamos la firma de la otra parte.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Firmar electrónicamente')).not.toBeInTheDocument();
  });
});
