/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import ProveedorDetailPage from '@/app/proveedores/[id]/page';
import api from '@/lib/api';

const apiGetMock = api.get as unknown as jest.Mock;

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '10' }),
}));

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('ProveedorDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiGetMock.mockResolvedValue({
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
