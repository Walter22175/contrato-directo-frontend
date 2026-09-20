/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import FaqPage from '@/app/ayuda/faq/page';

describe('FaqPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<FaqPage />);
    });
    const headings = screen.getAllByText('Preguntas Frecuentes');
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it('renders search input', async () => {
    await act(async () => {
      render(<FaqPage />);
    });
    expect(screen.getByPlaceholderText('Buscar preguntas...')).toBeInTheDocument();
  });

  it('renders category filter buttons', async () => {
    await act(async () => {
      render(<FaqPage />);
    });
    expect(screen.getByText('Todas')).toBeInTheDocument();
  });
});
