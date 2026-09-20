/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import DocumentosPage from '@/app/dashboard/documentos/page';

describe('DocumentosPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<DocumentosPage />);
    });
    expect(screen.getByText('Mis Documentos y Contratos')).toBeInTheDocument();
  });

  it('renders search input', async () => {
    await act(async () => {
      render(<DocumentosPage />);
    });
    expect(screen.getByPlaceholderText('Buscar contratos...')).toBeInTheDocument();
  });

  it('renders tab buttons', async () => {
    await act(async () => {
      render(<DocumentosPage />);
    });
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Pendientes')).toBeInTheDocument();
    expect(screen.getByText('Firmados')).toBeInTheDocument();
  });
});
