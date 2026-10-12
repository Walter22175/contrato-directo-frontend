/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act, fireEvent } from '@testing-library/react';
import api from '@/lib/api';
import AdminServiciosPage from '@/app/dashboard/admin/servicios/page';

const apiGet = api.get as jest.Mock;
const apiPost = api.post as jest.Mock;

const respuesta = (data: unknown) =>
  Promise.resolve({ data: { statusCode: 200, timestamp: '', data } });

const categoriasMock = [
  { id_categoria: 1, nombre: 'Mantenimiento y Reparaciones Domiciliarias', descripcion: 'Servicios del hogar', activa: true },
];

describe('AdminServiciosPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<AdminServiciosPage />);
    });
    expect(screen.getByText('Gestión de Servicios')).toBeInTheDocument();
  });

  it('renders tab buttons', async () => {
    await act(async () => {
      render(<AdminServiciosPage />);
    });
    expect(screen.getByText('Categorías')).toBeInTheDocument();
    expect(screen.getByText('Servicios')).toBeInTheDocument();
    expect(screen.getByText('Catálogo Dinámico')).toBeInTheDocument();
  });

  it('shows dynamic catalog tab content when selected', async () => {
    await act(async () => {
      render(<AdminServiciosPage />);
    });
    await act(async () => {
      screen.getByText('Catálogo Dinámico').click();
    });
    expect(screen.getByText('Temas en umbral')).toBeInTheDocument();
    expect(screen.getByText('Solicitudes de rubro')).toBeInTheDocument();
    expect(screen.getByText('Búsquedas fallidas recientes')).toBeInTheDocument();
    expect(screen.getByText('Evaluar umbrales')).toBeInTheDocument();
  });

  it('shows empty states in dynamic tab with mocked API', async () => {
    await act(async () => {
      render(<AdminServiciosPage />);
    });
    await act(async () => {
      screen.getByText('Catálogo Dinámico').click();
    });
    expect(screen.getByText('Ningún tema alcanzó el umbral todavía.')).toBeInTheDocument();
    expect(screen.getByText('No hay solicitudes pendientes de revisión.')).toBeInTheDocument();
    expect(screen.getByText('No hay búsquedas fallidas registradas.')).toBeInTheDocument();
  });

  describe('CRUD de servicios', () => {
    beforeEach(() => {
      apiGet.mockReset();
      apiPost.mockReset();
      apiGet.mockImplementation((url: string) => {
        if (url === '/catalogo/categorias') return respuesta({ data: categoriasMock });
        if (url === '/servicios') return respuesta({ data: [] });
        return respuesta({ data: [] });
      });
      apiPost.mockImplementation(() => respuesta({}));
    });

    const abrirTabServicios = async () => {
      await act(async () => {
        screen.getByText('Servicios').click();
      });
    };

    const abrirFormNuevo = async () => {
      await act(async () => {
        screen.getByText('Nuevo servicio').click();
      });
    };

    it('opens the new service form from the services tab', async () => {
      await act(async () => {
        render(<AdminServiciosPage />);
      });
      await abrirTabServicios();
      expect(screen.getByText('Nuevo servicio')).toBeInTheDocument();
      await abrirFormNuevo();
      expect(screen.getByText('Nuevo servicio')).toBeInTheDocument();
      expect(screen.getByText('Crear servicio')).toBeInTheDocument();
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
      expect(apiPost).not.toHaveBeenCalled();
    });

    it('validates that the name is required', async () => {
      await act(async () => {
        render(<AdminServiciosPage />);
      });
      await abrirTabServicios();
      await abrirFormNuevo();
      await act(async () => {
        screen.getByText('Crear servicio').click();
      });
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument();
      expect(apiPost).not.toHaveBeenCalled();
    });

    it('creates a service with name and category', async () => {
      await act(async () => {
        render(<AdminServiciosPage />);
      });
      await abrirTabServicios();
      await abrirFormNuevo();

      fireEvent.change(screen.getByPlaceholderText('Ej: Albañilería'), {
        target: { value: 'Albañilería' },
      });
      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: '1' },
      });

      await act(async () => {
        screen.getByText('Crear servicio').click();
      });

      expect(apiPost).toHaveBeenCalledWith('/servicios', {
        id_categoria: 1,
        nombre: 'Albañilería',
        activo: true,
      });
      expect(screen.getByText('Servicio "Albañilería" creado correctamente')).toBeInTheDocument();
    });

    it('sends palabras clave split by comma', async () => {
      await act(async () => {
        render(<AdminServiciosPage />);
      });
      await abrirTabServicios();
      await abrirFormNuevo();

      fireEvent.change(screen.getByPlaceholderText('Ej: Albañilería'), {
        target: { value: 'Techos' },
      });
      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: '1' },
      });
      fireEvent.change(screen.getByPlaceholderText('Ej: albañil, obra menor, revoque'), {
        target: { value: 'techo, membrana, chapa' },
      });

      await act(async () => {
        screen.getByText('Crear servicio').click();
      });

      expect(apiPost).toHaveBeenCalledWith('/servicios', {
        id_categoria: 1,
        nombre: 'Techos',
        palabras_clave: ['techo', 'membrana', 'chapa'],
        activo: true,
      });
    });
  });
});
