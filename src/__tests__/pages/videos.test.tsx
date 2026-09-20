/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import VideosPage from '@/app/ayuda/videos/page';

describe('VideosPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<VideosPage />);
    });
    expect(screen.getByText('Videos Explicativos')).toBeInTheDocument();
  });

  it('renders video cards', async () => {
    await act(async () => {
      render(<VideosPage />);
    });
    expect(screen.getByText('Bienvenido a Contrato Directo')).toBeInTheDocument();
    expect(screen.getByText('Cómo registrarse')).toBeInTheDocument();
  });
});
