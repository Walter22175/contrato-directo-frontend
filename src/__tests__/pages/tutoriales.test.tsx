/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import TutorialesPage from '@/app/ayuda/tutoriales/page';

describe('TutorialesPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<TutorialesPage />);
    });
    expect(screen.getByText('Tutoriales Paso a Paso')).toBeInTheDocument();
  });

  it('renders tutorial cards', async () => {
    await act(async () => {
      render(<TutorialesPage />);
    });
    expect(screen.getByText('Cómo registrarse como cliente')).toBeInTheDocument();
    expect(screen.getByText('Cómo buscar y contratar un servicio')).toBeInTheDocument();
    expect(screen.getByText('Cómo realizar un pago')).toBeInTheDocument();
  });
});
