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
    expect(screen.getByText('Reclamos')).toBeInTheDocument();
  });

  it('renders tab buttons', async () => {
    await act(async () => {
      render(<ReclamosPage />);
    });
    expect(screen.getAllByText('Todos').length).toBeGreaterThanOrEqual(1);
  });

  it('renders new claim button', async () => {
    await act(async () => {
      render(<ReclamosPage />);
    });
    expect(screen.getByText('Nuevo Reclamo')).toBeInTheDocument();
  });

  it('renders estado filter buttons', async () => {
    await act(async () => {
      render(<ReclamosPage />);
    });
    expect(screen.getByText('Abierto')).toBeInTheDocument();
    expect(screen.getByText('En revisión')).toBeInTheDocument();
  });
});
