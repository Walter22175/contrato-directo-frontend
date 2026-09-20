/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import Textarea from '@/components/ui/Textarea';

describe('Textarea', () => {
  it('renders textarea element', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Textarea label="Descripción" />);
    expect(screen.getByText('Descripción')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Textarea error="Muy corto" />);
    expect(screen.getByText('Muy corto')).toBeInTheDocument();
  });

  it('applies placeholder', () => {
    render(<Textarea placeholder="Escribí acá..." />);
    expect(screen.getByPlaceholderText('Escribí acá...')).toBeInTheDocument();
  });
});
