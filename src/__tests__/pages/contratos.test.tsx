/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import ContratosPage from '@/app/dashboard/contratos/page';

describe('ContratosPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<ContratosPage />);
    });
    expect(screen.getByText('Mis Contratos')).toBeInTheDocument();
  });

  it('renders subtitle', async () => {
    await act(async () => {
      render(<ContratosPage />);
    });
    expect(screen.getByText('Gestioná y firmá tus contratos digitales')).toBeInTheDocument();
  });

  it('shows empty state initially', async () => {
    await act(async () => {
      render(<ContratosPage />);
    });
    expect(screen.getByText('Sin contratos')).toBeInTheDocument();
  });
});
