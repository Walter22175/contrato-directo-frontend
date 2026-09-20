/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import NotificacionesPage from '@/app/dashboard/notificaciones/page';

describe('NotificacionesPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<NotificacionesPage />);
    });
    expect(screen.getByText('Notificaciones')).toBeInTheDocument();
  });

  it('shows filter toggle button', async () => {
    await act(async () => {
      render(<NotificacionesPage />);
    });
    expect(screen.getByText('Sin leer')).toBeInTheDocument();
  });
});
