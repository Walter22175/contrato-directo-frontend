/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import AdminReportesPage from '@/app/dashboard/admin/reportes/page';

describe('AdminReportesPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<AdminReportesPage />);
    });
    expect(screen.getByText('Reportes Agregados')).toBeInTheDocument();
  });

  it('renders period selector', async () => {
    await act(async () => {
      render(<AdminReportesPage />);
    });
    expect(screen.getByText('Período Actual')).toBeInTheDocument();
  });
});
