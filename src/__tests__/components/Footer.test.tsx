/**
 * @jest-environment jsdom
 */
import '../pages/setup';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/layout/Footer';

describe('Footer', () => {
  it('renders the brand name', () => {
    render(<Footer />);
    expect(screen.getByText('Contrato Directo')).toBeInTheDocument();
  });

  it('renders tagline', () => {
    render(<Footer />);
    expect(screen.getByText(/Conecta\. Acuerda\. Realiza/)).toBeInTheDocument();
  });

  it('renders platform links', () => {
    render(<Footer />);
    expect(screen.getByText('Buscar Servicios')).toBeInTheDocument();
    expect(screen.getByText('Ser Proveedor')).toBeInTheDocument();
    expect(screen.getByText('Centro de Ayuda')).toBeInTheDocument();
  });

  it('renders legal links', () => {
    render(<Footer />);
    expect(screen.getByText('Términos y Condiciones')).toBeInTheDocument();
    expect(screen.getByText('Política de Privacidad')).toBeInTheDocument();
  });

  it('renders copyright', () => {
    render(<Footer />);
    expect(screen.getByText(/Todos los derechos reservados/)).toBeInTheDocument();
  });
});
