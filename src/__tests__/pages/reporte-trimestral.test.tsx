/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import ReporteTrimestralPage from '@/app/dashboard/admin/reportes/trimestral/page';

describe('ReporteTrimestralPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<ReporteTrimestralPage />);
    });
    expect(screen.getByText('Reporte Trimestral')).toBeInTheDocument();
  });

  it('renders frequent topics section', async () => {
    await act(async () => {
      render(<ReporteTrimestralPage />);
    });
    expect(screen.getByText('Temas de Consulta Más Frecuentes')).toBeInTheDocument();
  });

  it('renders improvement areas section', async () => {
    await act(async () => {
      render(<ReporteTrimestralPage />);
    });
    expect(screen.getByText('Áreas de Mejora Identificadas')).toBeInTheDocument();
  });
});
