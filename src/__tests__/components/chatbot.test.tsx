import { render, screen } from '@testing-library/react';
import Chatbot from '@/components/ayuda/Chatbot';

describe('Chatbot', () => {
  it('renders the chat button initially', () => {
    render(<Chatbot />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
