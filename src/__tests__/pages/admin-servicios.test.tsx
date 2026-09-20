/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import AdminServiciosPage from '@/app/dashboard/admin/servicios/page';

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
  });
});
