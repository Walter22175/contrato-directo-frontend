/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import AdminServiciosPage from '@/app/dashboard/admin/servicios/page';

describe('AdminServiciosPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<AdminServiciosPage />);
    });
    expect(screen.getByText('Gestión de Servicios')).toBeInTheDocument();
  });

  it('renders tab buttons', async () => {
    await act(async () => {
      render(<AdminServiciosPage />);
    });
    expect(screen.getByText('Categorías')).toBeInTheDocument();
    expect(screen.getByText('Servicios')).toBeInTheDocument();
    expect(screen.getByText('Catálogo Dinámico')).toBeInTheDocument();
  });

  it('shows dynamic catalog tab content when selected', async () => {
    await act(async () => {
      render(<AdminServiciosPage />);
    });
    await act(async () => {
      screen.getByText('Catálogo Dinámico').click();
    });
    expect(screen.getByText('Temas en umbral')).toBeInTheDocument();
    expect(screen.getByText('Solicitudes de rubro')).toBeInTheDocument();
    expect(screen.getByText('Búsquedas fallidas recientes')).toBeInTheDocument();
    expect(screen.getByText('Evaluar umbrales')).toBeInTheDocument();
  });

  it('shows empty states in dynamic tab with mocked API', async () => {
    await act(async () => {
      render(<AdminServiciosPage />);
    });
    await act(async () => {
      screen.getByText('Catálogo Dinámico').click();
    });
    expect(screen.getByText('Ningún tema alcanzó el umbral todavía.')).toBeInTheDocument();
    expect(screen.getByText('No hay solicitudes pendientes de revisión.')).toBeInTheDocument();
    expect(screen.getByText('No hay búsquedas fallidas registradas.')).toBeInTheDocument();
  });
});
