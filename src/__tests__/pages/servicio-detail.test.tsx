/**
 * @jest-environment jsdom
 */
import './setup';
import { render, act } from '@testing-library/react';
import ServicioDetailPage from '@/app/servicios/[id]/page';

describe('ServicioDetailPage', () => {
  it('renders without crashing', async () => {
    await act(async () => {
      const { container } = render(<ServicioDetailPage />);
      expect(container).toBeTruthy();
    });
  });
});
