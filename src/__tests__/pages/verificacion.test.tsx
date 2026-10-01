/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import api from '@/lib/api';
import VerificacionPage from '@/app/proveedores/verificacion/page';

describe('VerificacionProveedorPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra los estados de validación y el SLA de 72 horas hábiles', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        statusCode: 200,
        timestamp: '',
        data: {
          sello_verificado: false,
          fecha_verificacion: null,
          verificaciones: [
            {
              id_verificacion: 2,
              tipo_documento: 'doc_fiscal',
              estado: 'en_revision',
              fecha_envio: '2026-09-28T10:00:00Z',
              fecha_limite_revision: '2026-10-03T10:00:00Z',
            },
            {
              id_verificacion: 1,
              tipo_documento: 'dni',
              estado: 'rechazado',
              observaciones: 'Foto ilegible',
            },
            {
              id_verificacion: 3,
              tipo_documento: 'avales',
              estado: 'pendiente',
            },
          ],
        },
      },
    });

    await act(async () => {
      render(<VerificacionPage />);
    });

    expect(screen.getByText('Estado de Verificación')).toBeInTheDocument();
    expect(screen.getByText('Documentación Fiscal')).toBeInTheDocument();
    expect(screen.getByText('En revisión')).toBeInTheDocument();
    expect(screen.getByText('Rechazado')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Foto ilegible')).toBeInTheDocument();
    expect(screen.getAllByText(/72 horas hábiles/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Reenviar documentación')).toBeInTheDocument();
  });

  it('muestra estado vacío cuando no hay documentos', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        statusCode: 200,
        timestamp: '',
        data: { sello_verificado: true, fecha_verificacion: '2026-09-01T10:00:00Z', verificaciones: [] },
      },
    });

    await act(async () => {
      render(<VerificacionPage />);
    });

    expect(screen.getByText('Proveedor verificado')).toBeInTheDocument();
    expect(screen.getByText('No hay documentos en revisión')).toBeInTheDocument();
  });

  it('ofrece convertirse cuando el usuario no tiene perfil de proveedor', async () => {
    const error: any = new Error('Not found');
    error.response = { status: 404 };
    (api.get as jest.Mock).mockRejectedValue(error);

    await act(async () => {
      render(<VerificacionPage />);
    });

    expect(screen.getByText('Todavía no sos proveedor')).toBeInTheDocument();
  });
});
