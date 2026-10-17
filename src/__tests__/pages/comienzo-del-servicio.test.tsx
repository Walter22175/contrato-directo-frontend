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
      screen.getAllByText(/el inicio efectivo es la/i).length,
    ).toBeGreaterThanOrEqual(1);
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

  it('incluye las condiciones legales del comienzo notificado y la liberación anticipada', async () => {
    await act(async () => {
      render(<ComienzoDelServicioPage />);
    });
    expect(
      screen.getByRole('heading', { name: /comienzo notificado/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /liberación anticipada del 30%/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /^resto del pago$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/nunca puede superar el 100% del monto total/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/complementando los términos y condiciones/i),
    ).toBeInTheDocument();
  });
});
