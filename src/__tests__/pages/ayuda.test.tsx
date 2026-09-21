/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import AyudaPage from '@/app/ayuda/page';

describe('AyudaPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<AyudaPage />);
    });
    expect(screen.getAllByText('Centro de Ayuda').length).toBeGreaterThanOrEqual(1);
  });

  it('renders search input', async () => {
    await act(async () => {
      render(<AyudaPage />);
    });
    expect(screen.getByPlaceholderText('Buscá preguntas frecuentes...')).toBeInTheDocument();
  });

  it('renders "Todas" filter button', async () => {
    await act(async () => {
      render(<AyudaPage />);
    });
    expect(screen.getByText('Todas')).toBeInTheDocument();
  });

  it('renders contact section', async () => {
    await act(async () => {
      render(<AyudaPage />);
    });
    expect(screen.getByText('¿No encontraste tu respuesta?')).toBeInTheDocument();
  });
});
