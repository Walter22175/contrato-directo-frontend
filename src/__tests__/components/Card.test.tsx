import { render, screen } from '@testing-library/react';
import { Card, CardTitle } from '@/components/ui/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card><p>Content</p></Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies hover class when hover prop is true', () => {
    render(<Card hover><p>Hoverable</p></Card>);
    const card = screen.getByText('Hoverable').closest('div');
    expect(card?.className).toContain('cursor-pointer');
  });

  it('renders CardTitle', () => {
    render(<Card><CardTitle>My Title</CardTitle></Card>);
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });
});
