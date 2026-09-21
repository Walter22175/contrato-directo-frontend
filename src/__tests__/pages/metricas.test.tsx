/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import MetricasPage from '@/app/dashboard/admin/metricas/page';

describe('MetricasPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<MetricasPage />);
    });
    expect(screen.getByText('Métricas de Atención')).toBeInTheDocument();
  });

  it('renders SLA objectives section', async () => {
    await act(async () => {
      render(<MetricasPage />);
    });
    expect(screen.getByText('Objetivos de SLA')).toBeInTheDocument();
  });

  it('renders agent metrics section', async () => {
    await act(async () => {
      render(<MetricasPage />);
    });
    expect(screen.getByText('Métricas por Agente')).toBeInTheDocument();
  });
});
