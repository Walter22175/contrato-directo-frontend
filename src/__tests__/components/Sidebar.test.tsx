/**
 * @jest-environment jsdom
 */
import '../pages/setup';
import { render, screen } from '@testing-library/react';
import Sidebar from '@/components/layout/Sidebar';

describe('Sidebar', () => {
  it('renders navigation links', () => {
    render(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders navigation links for cliente role', () => {
    render(<Sidebar />);
    expect(screen.getByText('Mis Transacciones')).toBeInTheDocument();
    expect(screen.getByText('Mis Contratos')).toBeInTheDocument();
    expect(screen.getByText('Mis Valoraciones')).toBeInTheDocument();
    expect(screen.getByText('Soporte')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
    expect(screen.getByText('Centro de Ayuda')).toBeInTheDocument();
  });

  it('renders the admin Mercado Pago and internal manual links', () => {
    render(<Sidebar role="admin" />);
    expect(screen.getByRole('link', { name: /mercado pago/i })).toHaveAttribute(
      'href',
      '/dashboard/admin/mercado-pago',
    );
    expect(screen.getByRole('link', { name: /manual de soporte/i })).toHaveAttribute(
      'href',
      '/ayuda/interno/manual-soporte',
    );
  });
});
