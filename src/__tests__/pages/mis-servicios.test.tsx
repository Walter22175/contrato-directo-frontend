/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import MisServiciosPage from '@/app/dashboard/mis-servicios/page';

describe('MisServiciosPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<MisServiciosPage />);
    });
    expect(screen.getByText('Mis Servicios')).toBeInTheDocument();
  });

  it('shows empty state initially', async () => {
    await act(async () => {
      render(<MisServiciosPage />);
    });
    expect(screen.getByText('Aún no tenés servicios asociados')).toBeInTheDocument();
  });
});
