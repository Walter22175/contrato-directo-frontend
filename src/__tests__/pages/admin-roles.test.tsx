/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import api from '@/lib/api';
import AdminRolesPage from '@/app/dashboard/admin/roles/page';

const rolesBase = [
  { id_rol: 1, nombre: 'cliente', descripcion: 'Cliente' },
  { id_rol: 2, nombre: 'proveedor', descripcion: 'Proveedor' },
  { id_rol: 3, nombre: 'super_admin', descripcion: 'Admin principal' },
];

const detalleRol = (id_rol: number) => ({
  data: {
    statusCode: 200,
    timestamp: '',
    data: {
      id_rol,
      usuario_roles:
        id_rol === 1
          ? [
              { activo: true },
              { activo: false },
            ]
          : [],
    },
  },
});

const mockGet = (roles: typeof rolesBase) =>
  (api.get as jest.Mock).mockImplementation((url: string) => {
    if (url === '/roles') {
      return Promise.resolve({
        data: { statusCode: 200, timestamp: '', data: roles, meta: { total: roles.length } },
      });
    }
    const match = url.match(/^\/roles\/(\d+)$/);
    if (match) {
      return Promise.resolve(detalleRol(Number(match[1])));
    }
    return Promise.resolve({ data: { statusCode: 200, timestamp: '', data: {} } });
  });

describe('AdminRolesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lista los roles existentes con su cantidad de usuarios', async () => {
    mockGet(rolesBase);

    await act(async () => {
      render(<AdminRolesPage />);
    });

    expect(await screen.findByText('Gestión de Roles')).toBeInTheDocument();
    expect(await screen.findByText('cliente')).toBeInTheDocument();
    expect(await screen.findByText('super admin')).toBeInTheDocument();
    expect(await screen.findByText('1 usuario')).toBeInTheDocument();
  });

  it('sugiere solo los nombres no creados y crea el rol seleccionado', async () => {
    mockGet(rolesBase);

    await act(async () => {
      render(<AdminRolesPage />);
    });

    const input = await screen.findByLabelText('Nombre del rol');
    const datalist = document.getElementById('roles-sugeridos');
    const opciones = Array.from(datalist?.querySelectorAll('option') || []).map(
      (o) => (o as HTMLOptionElement).value,
    );
    expect(opciones).toContain('mediador');
    expect(opciones).not.toContain('cliente');

    fireEvent.change(input, { target: { value: 'mediador' } });
    fireEvent.change(screen.getByLabelText('Descripción'), {
      target: { value: 'Resuelve reclamos' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Crear rol/ }));
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/roles', {
        nombre: 'mediador',
        descripcion: 'Resuelve reclamos',
        permisos: {},
      });
    });
    expect(await screen.findByText(/Rol "mediador" creado correctamente/)).toBeInTheDocument();
  });

  it('permite crear un rol con nombre libre aunque ya existan todos los sugeridos', async () => {
    mockGet(rolesBase);

    await act(async () => {
      render(<AdminRolesPage />);
    });

    fireEvent.change(await screen.findByLabelText('Nombre del rol'), {
      target: { value: 'coordinador_tecnicos' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Crear rol/ }));
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/roles', {
        nombre: 'coordinador_tecnicos',
        descripcion: undefined,
        permisos: {},
      });
    });
  });

  it('no crea el rol si el nombre no respeta el patrón', async () => {
    mockGet(rolesBase);

    await act(async () => {
      render(<AdminRolesPage />);
    });

    fireEvent.change(await screen.findByLabelText('Nombre del rol'), {
      target: { value: 'Nombre con espacios' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Crear rol/ }));
    });

    expect(await screen.findByText(/El nombre debe ir en minúsculas/)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('no crea el rol si los permisos no son JSON válido', async () => {
    mockGet(rolesBase);

    await act(async () => {
      render(<AdminRolesPage />);
    });

    const select = await screen.findByLabelText('Nombre del rol');
    fireEvent.change(select, { target: { value: 'mediador' } });
    fireEvent.change(screen.getByLabelText('Permisos (JSON)'), {
      target: { value: '{esto no es json' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Crear rol/ }));
    });

    expect(await screen.findByText('Los permisos no son JSON válido')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('el formulario sigue habilitado para nombre libre cuando todos los sugeridos existen', async () => {
    const todos = [
      { id_rol: 1, nombre: 'cliente', descripcion: 'Cliente' },
      { id_rol: 2, nombre: 'proveedor', descripcion: 'Proveedor' },
      { id_rol: 3, nombre: 'super_admin', descripcion: 'Admin' },
      { id_rol: 4, nombre: 'sistemas', descripcion: 'Sistemas' },
      { id_rol: 5, nombre: 'admin_contable', descripcion: 'Contable' },
      { id_rol: 6, nombre: 'admin_comercial', descripcion: 'Comercial' },
      { id_rol: 7, nombre: 'agente_atencion', descripcion: 'Agente' },
      { id_rol: 8, nombre: 'mediador', descripcion: 'Mediador' },
    ];
    mockGet(todos);

    await act(async () => {
      render(<AdminRolesPage />);
    });

    expect(await screen.findByLabelText('Nombre del rol')).toBeEnabled();
    expect(screen.getByText(/0 sin crear/)).toBeInTheDocument();
    expect(
      screen.queryByText(/Todos los roles disponibles ya fueron creados/),
    ).not.toBeInTheDocument();
  });
});
