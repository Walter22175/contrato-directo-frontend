/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import ComienzoDelServicioPage from '@/app/ayuda/comienzo-del-servicio/page';

describe('ComienzoDelServicioPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<ComienzoDelServicioPage />);
    });
    expect(
      screen.getByRole('heading', {
        name: /comienzo del servicio y anticipo del 30%/i,
      }),
    ).toBeInTheDocument();
  });

  it('explica el inicio efectivo y la liberación del 30%', async () => {
    await act(async () => {
      render(<ComienzoDelServicioPage />);
    });
    expect(
      screen.getByText(/el inicio efectivo es la/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/segunda notificación/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/72 horas calendario/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(/el 30% se liberará automáticamente en horario bancario hábil/i),
    ).toBeInTheDocument();
  });

  it('incluye los roles de cliente y proveedor', async () => {
    await act(async () => {
      render(<ComienzoDelServicioPage />);
    });
    expect(
      screen.getByRole('heading', { name: /tu rol como cliente/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /tu rol como proveedor/i }),
    ).toBeInTheDocument();
  });

  it('explica por qué existe el anticipo y qué pasa si no se notifica', async () => {
    await act(async () => {
      render(<ComienzoDelServicioPage />);
    });
    expect(
      screen.getByRole('heading', { name: /por qué existe este anticipo/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /qué pasa si no notifico/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/el administrador puede forzar el inicio/i),
    ).toBeInTheDocument();
  });
});
