/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import ServiciosPage from '@/app/servicios/page';

describe('ServiciosPage', () => {
  it('renders the search heading', async () => {
    await act(async () => {
      render(<ServiciosPage />);
    });
    expect(screen.getByRole('heading', { name: 'Buscar Servicios' })).toBeInTheDocument();
  });

  it('renders search input', async () => {
    await act(async () => {
      render(<ServiciosPage />);
    });
    expect(screen.getByPlaceholderText('¿Qué servicio buscás?')).toBeInTheDocument();
  });

  it('shows empty results initially', async () => {
    await act(async () => {
      render(<ServiciosPage />);
    });
    expect(screen.getByText('No se encontraron servicios')).toBeInTheDocument();
  });
});
