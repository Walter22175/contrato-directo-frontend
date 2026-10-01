/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act, fireEvent } from '@testing-library/react';
import SolicitudRubroPage from '@/app/proveedores/solicitud/page';

const api = require('@/lib/api').default;

const solicitudesMock = [
  {
    id_solicitud: 1,
    nombre_propuesto: 'Instalación de Paneles Solares',
    tipo: 'rubro',
    descripcion: 'Instalación y mantenimiento',
    justificacion: 'Alta demanda de búsquedas sin resultados',
    estado: 'pendiente',
    origen: 'manual',
    fecha_solicitud: '2026-09-20T10:00:00Z',
    fecha_limite_legal: '2026-09-27T10:00:00Z',
    apoyos_count: 3,
    apoyos_min: 5,
  },
  {
    id_solicitud: 2,
    nombre_propuesto: 'Fumigación Ecológica',
    tipo: 'servicio',
    estado: 'aprobado',
    origen: 'umbral_automatico',
    fecha_solicitud: '2026-08-01T10:00:00Z',
    fecha_limite_implementacion: '2026-08-12T10:00:00Z',
    observaciones: 'Comité: 2 aprobaciones (2 requeridas)',
    evaluacion_proceso: null,
    apoyos_count: 2,
    apoyos_min: 2,
  },
];

describe('SolicitudRubroPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValue({
      data: { statusCode: 200, timestamp: '', data: { data: [] } },
    });
  });

  it('renderiza encabezado e información de SLAs del Objetivo 5', async () => {
    await act(async () => {
      render(<SolicitudRubroPage />);
    });
    expect(screen.getByText('Solicitar Nuevo Rubro')).toBeInTheDocument();
    expect(screen.getByText('Cómo funciona el proceso')).toBeInTheDocument();
    expect(screen.getByText('5 días hábiles')).toBeInTheDocument();
    expect(screen.getByText('7 días hábiles')).toBeInTheDocument();
    expect(screen.getByText('5 para rubros')).toBeInTheDocument();
    expect(screen.getByText('2 para servicios')).toBeInTheDocument();
  });

  it('muestra estado vacío cuando no hay solicitudes', async () => {
    await act(async () => {
      render(<SolicitudRubroPage />);
    });
    expect(screen.getByText('Aún no enviaste solicitudes de rubro')).toBeInTheDocument();
  });

  it('abre y cierra el formulario de nueva solicitud', async () => {
    await act(async () => {
      render(<SolicitudRubroPage />);
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Nueva Solicitud'));
    });
    expect(screen.getByPlaceholderText('Ej: Instalación de Paneles Solares')).toBeInTheDocument();
    expect(screen.getByText('Justificación')).toBeInTheDocument();
  });

  it('lista solicitudes con justificación, SLA, apoyos y motivo de resolución', async () => {
    api.get.mockResolvedValue({
      data: { statusCode: 200, timestamp: '', data: { data: solicitudesMock } },
    });

    await act(async () => {
      render(<SolicitudRubroPage />);
    });

    expect(screen.getByText('Instalación de Paneles Solares')).toBeInTheDocument();
    expect(
      screen.getByText('Alta demanda de búsquedas sin resultados'),
    ).toBeInTheDocument();
    expect(screen.getByText(/SLA legal hasta:/)).toBeInTheDocument();
    expect(screen.getByText('Apoyos: 3/5')).toBeInTheDocument();

    // Solicitud resuelta: motivo + SLA de implementación + evaluación pendiente
    expect(screen.getByText('Fumigación Ecológica')).toBeInTheDocument();
    expect(screen.getByText(/Motivo \/ comunicación: Comité/)).toBeInTheDocument();
    expect(screen.getByText(/Implementación hasta:/)).toBeInTheDocument();
    expect(screen.getByText('¿Cómo fue el proceso?')).toBeInTheDocument();
    expect(screen.getByText('Apoyos: 2/2')).toBeInTheDocument();
  });

  it('muestra badge Automática para solicitudes generadas por umbral', async () => {
    api.get.mockResolvedValue({
      data: { statusCode: 200, timestamp: '', data: { data: solicitudesMock } },
    });

    await act(async () => {
      render(<SolicitudRubroPage />);
    });

    expect(screen.getByText('Automática')).toBeInTheDocument();
  });
});
