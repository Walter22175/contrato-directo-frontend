/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act, fireEvent } from '@testing-library/react';
import ProveedoresPage from '@/app/proveedores/page';
import api from '@/lib/api';

const apiGetMock = api.get as unknown as jest.Mock;

describe('ProveedoresPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    apiGetMock.mockResolvedValue({
      data: { statusCode: 200, timestamp: '', data: { data: [], meta: { total: 0 } } },
    });
  });

  it('renders page heading and search input', async () => {
    await act(async () => {
      render(<ProveedoresPage />);
    });
    expect(screen.getByText('Encontrá tu Proveedor')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar proveedores...')).toBeInTheDocument();
  });

  it('shows stats bar', async () => {
    await act(async () => {
      render(<ProveedoresPage />);
    });
    expect(screen.getByText('proveedores')).toBeInTheDocument();
    expect(screen.getByText('rubros')).toBeInTheDocument();
  });

  it('shows empty state with no results', async () => {
    await act(async () => {
      render(<ProveedoresPage />);
    });
    expect(screen.getByText('No se encontraron proveedores')).toBeInTheDocument();
    expect(screen.getByText('Solicitar nuevo rubro')).toBeInTheDocument();
  });

  it('toggles filters panel', async () => {
    await act(async () => {
      render(<ProveedoresPage />);
    });
    const btn = screen.getByLabelText('Filtros avanzados');
    await act(async () => { fireEvent.click(btn); });
    expect(screen.getByText('Filtros Avanzados')).toBeInTheDocument();
  });

  it('shows search history from localStorage', async () => {
    localStorage.setItem('proveedores_historial', JSON.stringify(['Plomero', 'Electricista']));
    await act(async () => {
      render(<ProveedoresPage />);
    });
    expect(screen.getByText('Recientes:')).toBeInTheDocument();
    expect(screen.getByText('Plomero')).toBeInTheDocument();
  });

  it('reports a failed search when no providers match', async () => {
    await act(async () => {
      render(<ProveedoresPage />);
    });
    const input = screen.getByPlaceholderText('Buscar proveedores...');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'gomeria' } });
    });
    expect(api.post).toHaveBeenCalledWith('/catalogo/busquedas-fallidas', {
      consulta: 'gomeria',
      tipo: 'servicio',
    });
  });
});
