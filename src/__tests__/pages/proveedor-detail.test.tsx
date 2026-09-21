/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import ProveedorDetailPage from '@/app/proveedores/[id]/page';

const api = require('@/lib/api').default;

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '10' }),
}));

jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  );
});

describe('ProveedorDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValue({
      data: { statusCode: 200, timestamp: '', data: null },
    });
  });

  it('renders without crashing', async () => {
    await act(async () => {
      const { container } = render(<ProveedorDetailPage />);
      expect(container).toBeTruthy();
    });
  });

  it('shows not found when provider is null', async () => {
    await act(async () => {
      render(<ProveedorDetailPage />);
    });
    expect(screen.getByText('Proveedor no encontrado')).toBeInTheDocument();
  });

  it('shows back link', async () => {
    await act(async () => {
      render(<ProveedorDetailPage />);
    });
    expect(screen.getByText('Volver a proveedores')).toBeInTheDocument();
  });
});
