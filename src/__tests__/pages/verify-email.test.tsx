/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act, waitFor } from '@testing-library/react';
import VerifyEmailPage from '@/app/auth/verify-email/page';
import api from '@/lib/api';

describe('VerifyEmailPage', () => {
  afterEach(() => {
    delete (globalThis as { __MOCK_SEARCH_PARAMS__?: string }).__MOCK_SEARCH_PARAMS__;
    jest.clearAllMocks();
  });

  it('muestra error si el enlace no tiene token', async () => {
    await act(async () => {
      render(<VerifyEmailPage />);
    });

    expect(
      screen.getByText('No pudimos verificar tu email'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('El enlace no incluye un token de verificación.'),
    ).toBeInTheDocument();
  });

  it('verifica el email con un token válido', async () => {
    (globalThis as { __MOCK_SEARCH_PARAMS__?: string }).__MOCK_SEARCH_PARAMS__ =
      'token=abc123';
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: {
        statusCode: 200,
        timestamp: '',
        data: { message: 'Email verificado exitosamente' },
      },
    });

    await act(async () => {
      render(<VerifyEmailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Email verificado')).toBeInTheDocument();
    });
    expect(api.post).toHaveBeenCalledWith('/auth/verify-email', {
      token: 'abc123',
    });
  });

  it('muestra el mensaje del backend si el token es inválido', async () => {
    (globalThis as { __MOCK_SEARCH_PARAMS__?: string }).__MOCK_SEARCH_PARAMS__ =
      'token=expirado';
    (api.post as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: 'Token inválido o expirado' } },
    });

    await act(async () => {
      render(<VerifyEmailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Token inválido o expirado')).toBeInTheDocument();
    });
  });
});
