/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import NovedadComienzoServicioPage from '@/app/ayuda/novedades/comienzo-servicio/page';

describe('NovedadComienzoServicioPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<NovedadComienzoServicioPage />);
    });
    expect(
      screen.getByRole('heading', {
        name: /nuevo sistema de confirmación del comienzo del servicio/i,
      }),
    ).toBeInTheDocument();
  });

  it('explica cómo funciona el comienzo notificado (A)', async () => {
    await act(async () => {
      render(<NovedadComienzoServicioPage />);
    });
    expect(
      screen.getByRole('heading', { name: /a\. cómo funciona/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/segunda notificación/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(/72 horas calendario/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/sigue retenido hasta tu conformidad/i).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('presenta los beneficios para el cliente (B)', async () => {
    await act(async () => {
      render(<NovedadComienzoServicioPage />);
    });
    expect(
      screen.getByRole('heading', { name: /b\. beneficios para vos como cliente/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/mayor transparencia/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/mayor control/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/el anticipo no afecta tus derechos/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/podés rechazar/i).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('incluye qué hacer y enlaces a ayuda, transacciones y soporte (C)', async () => {
    await act(async () => {
      render(<NovedadComienzoServicioPage />);
    });
    expect(
      screen.getByRole('heading', { name: /c\. qué tenés que hacer/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /ver la guía de ayuda/i }),
    ).toHaveAttribute('href', '/ayuda/comienzo-del-servicio');
    expect(
      screen.getByRole('link', { name: /ir a mis transacciones/i }),
    ).toHaveAttribute('href', '/dashboard/transacciones');
    expect(
      screen.getByRole('link', { name: /abrir un ticket/i }),
    ).toHaveAttribute('href', '/dashboard/tickets');
  });
});
