/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import ContactoPage from '@/app/contacto/page';

describe('ContactoPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<ContactoPage />);
    });
    expect(screen.getByText('Contacto')).toBeInTheDocument();
  });

  it('renders all contact channels', async () => {
    await act(async () => {
      render(<ContactoPage />);
    });
    expect(screen.getByText('Email / Tickets')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp Business')).toBeInTheDocument();
    expect(screen.getByText('Teléfono')).toBeInTheDocument();
    expect(screen.getAllByText('Centro de Ayuda').length).toBeGreaterThanOrEqual(1);
  });

  it('renders schedule information', async () => {
    await act(async () => {
      render(<ContactoPage />);
    });
    expect(screen.getByText('Horarios de Atención')).toBeInTheDocument();
    expect(screen.getByText('Horario estándar')).toBeInTheDocument();
  });
});
