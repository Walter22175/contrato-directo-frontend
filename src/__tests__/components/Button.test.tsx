import { render, screen } from '@testing-library/react';
import Button from '@/components/ui/Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { rerender } = render(<Button variant="outline">Test</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('border');

    rerender(<Button variant="ghost">Test</Button>);
    expect(btn.className).toContain('hover');
  });

  it('disables when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading spinner', () => {
    render(<Button isLoading>Cargando</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
