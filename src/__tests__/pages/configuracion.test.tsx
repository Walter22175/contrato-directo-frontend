/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import ConfiguracionPage from '@/app/dashboard/configuracion/page';

describe('ConfiguracionPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<ConfiguracionPage />);
    });
    expect(screen.getByText('Configuración')).toBeInTheDocument();
  });

  it('renders all three tabs', async () => {
    await act(async () => {
      render(<ConfiguracionPage />);
    });
    expect(screen.getByText('Perfil')).toBeInTheDocument();
    expect(screen.getByText('Contraseña')).toBeInTheDocument();
    expect(screen.getByText('Datos Fiscales')).toBeInTheDocument();
  });

  it('shows profile tab by default', async () => {
    await act(async () => {
      render(<ConfiguracionPage />);
    });
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(3);
  });

  it('renders save button', async () => {
    await act(async () => {
      render(<ConfiguracionPage />);
    });
    expect(screen.getByText('Guardar Cambios')).toBeInTheDocument();
  });
});
