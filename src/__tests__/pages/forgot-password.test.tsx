/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import ForgotPasswordPage from '@/app/auth/forgot-password/page';

describe('ForgotPasswordPage', () => {
  it('renders the forgot password form', async () => {
    await act(async () => {
      render(<ForgotPasswordPage />);
    });
    expect(screen.getByText('Recuperar Contraseña')).toBeInTheDocument();
    expect(screen.getByText('Te enviaremos un enlace para restablecer tu contraseña')).toBeInTheDocument();
  });

  it('renders email input', async () => {
    await act(async () => {
      render(<ForgotPasswordPage />);
    });
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders submit button', async () => {
    await act(async () => {
      render(<ForgotPasswordPage />);
    });
    expect(screen.getByRole('button', { name: /enviar enlace/i })).toBeInTheDocument();
  });

  it('renders back to login link', async () => {
    await act(async () => {
      render(<ForgotPasswordPage />);
    });
    expect(screen.getByText('Volver al Login')).toBeInTheDocument();
  });
});
