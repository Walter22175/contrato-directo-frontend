/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import TicketsPage from '@/app/dashboard/tickets/page';

describe('TicketsPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<TicketsPage />);
    });
    expect(screen.getByText('Mis Mensajes')).toBeInTheDocument();
  });

  it('has a new ticket button', async () => {
    await act(async () => {
      render(<TicketsPage />);
    });
    expect(screen.getByText('Nuevo')).toBeInTheDocument();
  });
});
