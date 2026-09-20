/**
 * @jest-environment jsdom
 */
import '../pages/setup';
import { render, screen } from '@testing-library/react';
import Header from '@/components/layout/Header';

describe('Header', () => {
  it('renders the brand name', () => {
    render(<Header />);
    expect(screen.getByText('Contrato Directo')).toBeInTheDocument();
  });

  it('renders navigation links when authenticated', () => {
    render(<Header />);
    expect(screen.getByText('Servicios')).toBeInTheDocument();
    expect(screen.getByText('Proveedores')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders user name when authenticated', () => {
    render(<Header />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
