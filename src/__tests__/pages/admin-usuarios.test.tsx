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

  it('quita un rol enviando id_rol (no id_usuario_rol) al endpoint, tras confirmar', async () => {
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

    // La acción NO se ejecuta hasta confirmar en el diálogo
    expect(api.delete).not.toHaveBeenCalled();

    const confirmar = await screen.findByTestId('confirm-accept');
    expect(
      screen.getByText(/¿Estás seguro de que querés quitar el rol "sistemas" a Ana Lopez\?/),
    ).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(confirmar);
    });

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/usuarios/u-1/roles/5');
    });
    expect(api.delete).not.toHaveBeenCalledWith('/usuarios/u-1/roles/999');
  });

  it('al cancelar en el diálogo no se quita el rol', async () => {
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
    await act(async () => {
      fireEvent.click(await screen.findByTitle('Quitar rol'));
    });

    const cancelar = await screen.findByTestId('confirm-cancel');
    await act(async () => {
      fireEvent.click(cancelar);
    });

    expect(api.delete).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByTestId('confirm-accept')).not.toBeInTheDocument();
    });
  });

  it('pide confirmación antes de asignar un rol', async () => {
    const usuario = {
      id_usuario: 'u-1',
      email: 'ana@test.com',
      nombre: 'Ana',
      apellido: 'Lopez',
      tipo_persona: 'fisica',
      estado: 'activo',
      email_verificado: true,
      fecha_registro: '2026-01-01T00:00:00Z',
      usuario_roles: [],
    };

    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/roles') {
        return Promise.resolve({
          data: {
            statusCode: 200,
            timestamp: '',
            data: [{ id_rol: 7, nombre: 'mediador' }],
          },
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

    const select = await screen.findByRole('combobox');
    await act(async () => {
      fireEvent.change(select, { target: { value: 'mediador' } });
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Asignar'));
    });

    // Aún no se ejecuta: aparece el diálogo de confirmación
    expect(api.post).not.toHaveBeenCalled();
    expect(
      screen.getByText(/¿Estás seguro de que querés asignar el rol "mediador" a Ana Lopez\?/),
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-accept'));
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/usuarios/u-1/roles', {
        rol: 'mediador',
      });
    });
  });

  it('al asignar el rol proveedor muestra el checklist de categorías y las envía en el payload', async () => {
    const usuario = {
      id_usuario: 'u-1',
      email: 'ana@test.com',
      nombre: 'Ana',
      apellido: 'Lopez',
      tipo_persona: 'fisica',
      estado: 'activo',
      email_verificado: true,
      fecha_registro: '2026-01-01T00:00:00Z',
      usuario_roles: [],
    };

    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/roles') {
        return Promise.resolve({
          data: {
            statusCode: 200,
            timestamp: '',
            data: [{ id_rol: 2, nombre: 'proveedor' }],
          },
        });
      }
      if (url === '/catalogo/categorias') {
        return Promise.resolve({
          data: {
            statusCode: 200,
            timestamp: '',
            data: [
              { id_categoria: 1, nombre: 'Albañilería', activa: true, orden: 1 },
              { id_categoria: 3, nombre: 'Electricidad', activa: true, orden: 2 },
            ],
          },
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

    const select = await screen.findByRole('combobox');
    await act(async () => {
      fireEvent.change(select, { target: { value: 'proveedor' } });
    });

    // Aparece el checklist de categorías de la plataforma
    const checklist = await screen.findByTestId('checklist-categorias-proveedor');
    expect(checklist).toBeInTheDocument();
    expect(screen.getByText('Albañilería')).toBeInTheDocument();
    expect(screen.getByText('Electricidad')).toBeInTheDocument();
    expect(
      screen.getByText(/Sin categorías marcadas: el proveedor podrá agregar servicios de cualquier categoría/),
    ).toBeInTheDocument();

    // Marcar una categoría con check
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Electricidad'));
    });
    expect(
      screen.getByText(/1 categoría seleccionada/),
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Asignar'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-accept'));
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/usuarios/u-1/roles', {
        rol: 'proveedor',
        categorias: [3],
      });
    });
  });
});
