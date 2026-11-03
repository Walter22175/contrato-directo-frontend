/**
 * @jest-environment jsdom
 */
import './setup';
import { fireEvent, render, screen, act, waitFor } from '@testing-library/react';
import ForgotPasswordPage from '@/app/auth/forgot-password/page';
import api from '@/lib/api';

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

  it('envía la solicitud y no revela si el email está registrado', async () => {
    await act(async () => {
      render(<ForgotPasswordPage />);
    });

    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar enlace/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'ana@example.com',
      });
      expect(screen.getByText('Revisá tu correo')).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        'Si el email está registrado, recibirás un enlace para restablecer tu contraseña.',
      ),
    ).toBeInTheDocument();
  });
});
