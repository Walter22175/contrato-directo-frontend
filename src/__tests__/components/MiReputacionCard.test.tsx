/**
 * @jest-environment jsdom
 */
import '../pages/setup';
import { render, screen, act } from '@testing-library/react';
import { MiReputacionCard } from '@/components/proveedor/MiReputacionCard';
import api from '@/lib/api';

jest.mock('@/lib/api');

describe('MiReputacionCard', () => {
  it('renders ranking data when available', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        id_ranking: 'rk-1',
        id_proveedor: 'p-1',
        puntaje_rating: 4.8,
        puntaje_antiguedad: 15,
        puntaje_transacciones: 18,
        puntaje_respuesta: 95,
        puntaje_cumplimiento: 98,
        puntaje_ranking: 85.5,
        posicion_ranking: 3,
        total_valoraciones: 12,
        promedio_valoraciones: 4.8,
        proveedor_destacado: true,
        fecha_calculo: new Date().toISOString(),
      },
    });

    await act(async () => {
      render(<MiReputacionCard idProveedor="p-1" />);
    });

    expect(screen.getByText('Mi Reputación en la Plataforma')).toBeInTheDocument();
    expect(screen.getByText('Proveedor Destacado')).toBeInTheDocument();
    expect(screen.getByText('85.5')).toBeInTheDocument();
  });
});
