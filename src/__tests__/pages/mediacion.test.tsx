/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import MediacionPage from '@/app/dashboard/mediacion/page';

describe('MediacionPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<MediacionPage />);
    });
    expect(screen.getByText('Espacio de Mediación')).toBeInTheDocument();
  });

  it('renders tab buttons', async () => {
    await act(async () => {
      render(<MediacionPage />);
    });
    expect(screen.getByText('Mis Reclamos')).toBeInTheDocument();
    expect(screen.getByText('Todos')).toBeInTheDocument();
  });
});
