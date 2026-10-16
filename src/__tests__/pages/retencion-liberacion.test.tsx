/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import RetencionLiberacionPage from '@/app/ayuda/retencion-liberacion/page';

describe('RetencionLiberacionPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra el título y la introducción legal', async () => {
    await act(async () => {
      render(<RetencionLiberacionPage />);
    });
    expect(
      screen.getByText('Retención, Liberación y Cancelación'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/sistema de pagos con custodia \(escrow\)/),
    ).toBeInTheDocument();
  });

  it('muestra la sección de retención con sus 4 condiciones', async () => {
    await act(async () => {
      render(<RetencionLiberacionPage />);
    });
    expect(screen.getByText('Retención del pago')).toBeInTheDocument();
    expect(
      screen.getByText(/La plataforma retiene el pago hasta que el cliente confirma/),
    ).toBeInTheDocument();
    expect(screen.getByText(/retención es temporal y automática/)).toBeInTheDocument();
    expect(
      screen.getByText(/El proveedor mantiene la titularidad del pago/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/La plataforma no puede disponer del dinero/),
    ).toBeInTheDocument();
  });

  it('muestra la liberación manual con registro de fecha y hora', async () => {
    await act(async () => {
      render(<RetencionLiberacionPage />);
    });
    expect(screen.getByText('Liberación manual')).toBeInTheDocument();
    expect(
      screen.getByText(/Cuando el cliente confirma la entrega, se libera/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/inmediata y definitiva/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/registra la fecha y hora de la liberación/),
    ).toBeInTheDocument();
  });

  it('muestra la liberación automática con reglas de horas hábiles', async () => {
    await act(async () => {
      render(<RetencionLiberacionPage />);
    });
    expect(
      screen.getByText('Liberación automática (72 hs hábiles)'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/el sistema libera el pago automáticamente/),
    ).toBeInTheDocument();
    expect(screen.getByText(/calendario de feriados oficiales/)).toBeInTheDocument();
    expect(
      screen.getByText(/debe haber marcado "entrega realizada"/),
    ).toBeInTheDocument();
  });

  it('muestra la cancelación con devolución y causa registrada', async () => {
    await act(async () => {
      render(<RetencionLiberacionPage />);
    });
    expect(screen.getByText('Cancelación')).toBeInTheDocument();
    expect(
      screen.getByText(/El cliente puede rechazar la entrega/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/se cancela y se devuelve íntegramente al cliente/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/registran la causa y la fecha de la cancelación/),
    ).toBeInTheDocument();
  });
});
