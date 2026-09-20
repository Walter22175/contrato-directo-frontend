/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import LoginPage from '@/app/auth/login/page';

describe('LoginPage', () => {
  it('renders the login heading', async () => {
    await act(async () => {
      render(<LoginPage />);
    });
    expect(screen.getAllByText('Iniciar Sesión').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Accedé a tu cuenta de Contrato Directo')).toBeInTheDocument();
  });

  it('renders email and password inputs', async () => {
    await act(async () => {
      render(<LoginPage />);
    });
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Contraseña')).toBeInTheDocument();
  });

  it('renders submit button', async () => {
    await act(async () => {
      render(<LoginPage />);
    });
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('renders register link', async () => {
    await act(async () => {
      render(<LoginPage />);
    });
    expect(screen.getByText('Registrate')).toBeInTheDocument();
  });
});
