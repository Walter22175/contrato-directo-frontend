/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import Select from '@/components/ui/Select';

describe('Select', () => {
  const options = [
    { value: 'fisica', label: 'Persona Física' },
    { value: 'juridica', label: 'Persona Jurídica' },
  ];

  it('renders with options', () => {
    render(<Select options={options} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Persona Física')).toBeInTheDocument();
    expect(screen.getByText('Persona Jurídica')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Select label="Tipo" options={options} />);
    expect(screen.getByText('Tipo')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Select options={options} placeholder="Seleccionar..." />);
    expect(screen.getByText('Seleccionar...')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Select options={options} error="Campo requerido" />);
    expect(screen.getByText('Campo requerido')).toBeInTheDocument();
  });
});
