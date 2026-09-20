/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';

describe('DashboardPage', () => {
  it('renders greeting with user name', async () => {
    await act(async () => {
      render(<DashboardPage />);
    });
    expect(screen.getByText(/Hola, Test/)).toBeInTheDocument();
  });

  it('renders subtitle', async () => {
    await act(async () => {
      render(<DashboardPage />);
    });
    expect(screen.getByText('Bienvenido a tu panel de control')).toBeInTheDocument();
  });

  it('renders stat cards', async () => {
    await act(async () => {
      render(<DashboardPage />);
    });
    expect(screen.getByText('Transacciones')).toBeInTheDocument();
    expect(screen.getByText('Contratos Activos')).toBeInTheDocument();
    expect(screen.getByText('Valoración Promedio')).toBeInTheDocument();
    expect(screen.getByText('Ingresos del Mes')).toBeInTheDocument();
  });

  it('renders recent activity section', async () => {
    await act(async () => {
      render(<DashboardPage />);
    });
    expect(screen.getByText('Actividad Reciente')).toBeInTheDocument();
  });
});
