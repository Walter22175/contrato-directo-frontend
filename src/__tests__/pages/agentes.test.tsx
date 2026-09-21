/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import AgentesPage from '@/app/dashboard/admin/agentes/page';

describe('AgentesPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<AgentesPage />);
    });
    expect(screen.getByText('Agentes de Soporte')).toBeInTheDocument();
  });

  it('renders agent stats cards', async () => {
    await act(async () => {
      render(<AgentesPage />);
    });
    expect(screen.getByText('Total Agentes')).toBeInTheDocument();
    expect(screen.getByText('Activos')).toBeInTheDocument();
    expect(screen.getByText('Tickets Asignados')).toBeInTheDocument();
  });

  it('renders team list', async () => {
    await act(async () => {
      render(<AgentesPage />);
    });
    expect(screen.getByText('Equipo')).toBeInTheDocument();
  });
});
