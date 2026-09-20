/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import ReclamosPage from '@/app/dashboard/reclamos/page';

describe('ReclamosPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<ReclamosPage />);
    });
    const headings = screen.getAllByText('Mis Reclamos');
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it('renders tab buttons', async () => {
    await act(async () => {
      render(<ReclamosPage />);
    });
    expect(screen.getByText('Todos')).toBeInTheDocument();
  });
});
