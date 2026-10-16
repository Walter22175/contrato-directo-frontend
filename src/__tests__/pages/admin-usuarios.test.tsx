/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import api from '@/lib/api';
import AdminUsuariosPage from '@/app/dashboard/admin/usuarios/page';

describe('AdminUsuariosPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page title', async () => {
    await act(async () => {
      render(<AdminUsuariosPage />);
    });
    expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument();
  });

  it('renders tab buttons', async () => {
    await act(async () => {
      render(<AdminUsuariosPage />);
    });
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Pendientes')).toBeInTheDocument();
    expect(screen.getByText('Verificados')).toBeInTheDocument();
  });

  it('renders search input', async () => {
    await act(async () => {
      render(<AdminUsuariosPage />);
    });
    expect(screen.getByPlaceholderText('Buscar por nombre, apellido o email...')).toBeInTheDocument();
  });

  it('quita un rol enviando id_rol (no id_usuario_rol) al endpoint', async () => {
    const usuario = {
      id_usuario: 'u-1',
      email: 'ana@test.com',
      nombre: 'Ana',
      apellido: 'Lopez',
      tipo_persona: 'fisica',
      estado: 'activo',
      email_verificado: true,
      fecha_registro: '2026-01-01T00:00:00Z',
      usuario_roles: [
        {
          id_usuario_rol: 999,
          id_usuario: 'u-1',
          id_rol: 5,
          activo: true,
          rol: { id_rol: 5, nombre: 'sistemas' },
        },
      ],
    };

    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/roles') {
        return Promise.resolve({
          data: { statusCode: 200, timestamp: '', data: [{ id_rol: 5, nombre: 'sistemas' }] },
        });
      }
      if (url === '/usuarios/u-1') {
        return Promise.resolve({
          data: { statusCode: 200, timestamp: '', data: usuario },
        });
      }
      return Promise.resolve({
        data: { statusCode: 200, timestamp: '', data: { data: [usuario], meta: { total: 1 } } },
      });
    });

    await act(async () => {
      render(<AdminUsuariosPage />);
    });

    fireEvent.click(await screen.findByText('Ana Lopez'));

    const botonQuitar = await screen.findByTitle('Quitar rol');
    await act(async () => {
      fireEvent.click(botonQuitar);
    });

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/usuarios/u-1/roles/5');
    });
    expect(api.delete).not.toHaveBeenCalledWith('/usuarios/u-1/roles/999');
  });
});
