/**
 * @jest-environment jsdom
 */
import './setup';
import { fireEvent, render, screen, act, waitFor } from '@testing-library/react';
import ResetPasswordPage from '@/app/auth/reset-password/page';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';

describe('ResetPasswordPage', () => {
  afterEach(() => {
    delete (globalThis as { __MOCK_SEARCH_PARAMS__?: string }).__MOCK_SEARCH_PARAMS__;
    jest.clearAllMocks();
  });

  it('actualiza la contraseña, cierra la sesión local y permite volver al login', async () => {
    (globalThis as { __MOCK_SEARCH_PARAMS__?: string }).__MOCK_SEARCH_PARAMS__ =
      'token=reset-token';

    await act(async () => {
      render(<ResetPasswordPage />);
    });

    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), {
      target: { value: 'NuevaPass1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repetí la contraseña'), {
      target: { value: 'NuevaPass1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Contraseña' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'reset-token',
        nueva_password: 'NuevaPass1',
      });
      expect(useAuthStore.getState().logout).toHaveBeenCalled();
      expect(screen.getByText('Contraseña Actualizada')).toBeInTheDocument();
    });
  });
});
