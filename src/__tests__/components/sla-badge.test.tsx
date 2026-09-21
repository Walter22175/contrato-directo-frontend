import { render, screen } from '@testing-library/react';
import SlaBadge from '@/components/sla/SlaBadge';

describe('SlaBadge', () => {
  it('renders cumplido state', () => {
    render(<SlaBadge estado="cumplido" />);
    expect(screen.getByText('Cumplido')).toBeInTheDocument();
  });

  it('renders en_riesgo state', () => {
    render(<SlaBadge estado="en_riesgo" />);
    expect(screen.getByText('En riesgo')).toBeInTheDocument();
  });

  it('renders vencido state', () => {
    render(<SlaBadge estado="vencido" />);
    expect(screen.getByText('Vencido')).toBeInTheDocument();
  });

  it('renders pendiente state', () => {
    render(<SlaBadge estado="pendiente" />);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });
});
