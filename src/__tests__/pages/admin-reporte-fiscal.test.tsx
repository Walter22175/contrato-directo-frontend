/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import AdminReporteFiscalPage from '@/app/dashboard/admin/reportes/fiscal/page';

describe('AdminReporteFiscalPage', () => {
  it('renders the fiscal report title and RG 5794 notice', async () => {
    await act(async () => {
      render(<AdminReporteFiscalPage />);
    });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Reportes Fiscales/i);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/RG 5794\/2025/i);
  });

  it('renders generate button and input', async () => {
    await act(async () => {
      render(<AdminReporteFiscalPage />);
    });
    expect(screen.getByRole('button', { name: /Generar Reporte/i })).toBeInTheDocument();
  });
});
