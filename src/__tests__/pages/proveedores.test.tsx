/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import ProveedoresPage from '@/app/proveedores/page';

describe('ProveedoresPage', () => {
  it('renders the page heading', async () => {
    await act(async () => {
      render(<ProveedoresPage />);
    });
    expect(screen.getByRole('heading', { name: 'Proveedores' })).toBeInTheDocument();
  });

  it('renders search input', async () => {
    await act(async () => {
      render(<ProveedoresPage />);
    });
    expect(screen.getByPlaceholderText('Buscar por rubro o nombre...')).toBeInTheDocument();
  });

  it('shows empty results initially', async () => {
    await act(async () => {
      render(<ProveedoresPage />);
    });
    expect(screen.getByText('No se encontraron proveedores')).toBeInTheDocument();
  });
});
