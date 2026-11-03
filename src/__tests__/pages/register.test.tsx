/**
 * @jest-environment jsdom
 */
import './setup';
import { fireEvent, render, screen, act, waitFor } from '@testing-library/react';
import RegisterPage from '@/app/auth/register/page';
import { useAuthStore } from '@/store/auth';

describe('RegisterPage', () => {
  it('renders the register form', async () => {
    await act(async () => {
      render(<RegisterPage />);
    });
    expect(screen.getAllByText('Crear Cuenta').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Registrate en Contrato Directo')).toBeInTheDocument();
  });

  it('renders form fields', async () => {
    await act(async () => {
      render(<RegisterPage />);
    });
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Contraseña')).toBeInTheDocument();
    expect(screen.getByText('Tipo de Persona')).toBeInTheDocument();
  });

  it('renders submit button', async () => {
    await act(async () => {
      render(<RegisterPage />);
    });
    expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument();
  });

  it('renders login link', async () => {
    await act(async () => {
      render(<RegisterPage />);
    });
    expect(screen.getByText('Iniciá Sesión')).toBeInTheDocument();
  });

  it('muestra la confirmación requerida después del registro', async () => {
    const registerUser = useAuthStore.getState().register as jest.Mock;
    registerUser.mockResolvedValueOnce({
      usuario: { id_usuario: 'user-1' },
      email_verificacion_enviada: true,
    });

    await act(async () => {
      render(<RegisterPage />);
    });

    fireEvent.change(screen.getByPlaceholderText('Tu nombre'), {
      target: { value: 'Ana' },
    });
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), {
      target: { value: 'Password1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(screen.getByText('Revisá tu correo')).toBeInTheDocument();
    });
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    expect(registerUser).toHaveBeenCalled();
  });
});
