/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import NovedadAnticipo30Page from '@/app/ayuda/novedades/anticipo-30/page';

describe('NovedadAnticipo30Page', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<NovedadAnticipo30Page />);
    });
    expect(
      screen.getByRole('heading', {
        name: /anticipo del 30% para servicios largos/i,
      }),
    ).toBeInTheDocument();
  });

  it('explica cómo funciona, por qué conviene y qué hacer (A/B/C)', async () => {
    await act(async () => {
      render(<NovedadAnticipo30Page />);
    });
    expect(
      screen.getByRole('heading', { name: /a\. cómo funciona/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /b\. por qué te conviene/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /c\. qué tenés que hacer/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/segunda notificación/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/72 horas calendario/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(/exclusivamente en horario bancario hábil/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/la liberación nunca es unilateral/i),
    ).toBeInTheDocument();
  });

  it('incluye enlaces al detalle de ayuda y al dashboard', async () => {
    await act(async () => {
      render(<NovedadAnticipo30Page />);
    });
    expect(
      screen.getByRole('link', { name: /comienzo del servicio y anticipo/i }),
    ).toHaveAttribute('href', '/ayuda/comienzo-del-servicio');
    expect(
      screen.getAllByRole('link', { name: /ir a mi dashboard/i }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole('link', { name: /abrir un ticket/i }),
    ).toHaveAttribute('href', '/dashboard/tickets');
  });

  it('aclara que el resto del pago no cambia', async () => {
    await act(async () => {
      render(<NovedadAnticipo30Page />);
    });
    expect(
      screen.getByRole('heading', { name: /el resto del pago no cambia/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/70% restante se libera con la conformidad del cliente/i),
    ).toBeInTheDocument();
  });
});
