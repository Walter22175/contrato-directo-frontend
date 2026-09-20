/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import RegisterPage from '@/app/auth/register/page';

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
});
