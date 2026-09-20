/**
 * @jest-environment jsdom
 */
import './setup';
import { render, act } from '@testing-library/react';
import ProveedorDetailPage from '@/app/proveedores/[id]/page';

describe('ProveedorDetailPage', () => {
  it('renders without crashing', async () => {
    await act(async () => {
      const { container } = render(<ProveedorDetailPage />);
      expect(container).toBeTruthy();
    });
  });
});
