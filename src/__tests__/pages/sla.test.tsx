/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import SlaPage from '@/app/dashboard/sla/page';

describe('SlaPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<SlaPage />);
    });
    expect(screen.getByText('Gestión de SLA')).toBeInTheDocument();
  });

  it('renders SLA configuration section', async () => {
    await act(async () => {
      render(<SlaPage />);
    });
    expect(screen.getByText('Configuración de Niveles SLA')).toBeInTheDocument();
  });

  it('renders all SLA levels', async () => {
    await act(async () => {
      render(<SlaPage />);
    });
    expect(screen.getAllByText('Consultas simples').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Consultas complejas').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Reclamos y mediación').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Emergencias').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Sugerencias y feedback').length).toBeGreaterThanOrEqual(1);
  });

  it('renders ticket tracking section', async () => {
    await act(async () => {
      render(<SlaPage />);
    });
    expect(screen.getByText('Seguimiento de Tickets')).toBeInTheDocument();
  });
});
