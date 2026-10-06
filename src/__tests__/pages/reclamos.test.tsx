/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act, fireEvent } from '@testing-library/react';
import ReclamosPage from '@/app/dashboard/reclamos/page';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Reclamo, SolicitudInfoReclamo } from '@/types';

describe('ReclamosPage', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<ReclamosPage />);
    });
    expect(screen.getByText('Reclamos')).toBeInTheDocument();
  });

  it('renders tab buttons', async () => {
    await act(async () => {
      render(<ReclamosPage />);
    });
    expect(screen.getAllByText('Todos').length).toBeGreaterThanOrEqual(1);
  });

  it('renders new claim button', async () => {
    await act(async () => {
      render(<ReclamosPage />);
    });
    expect(screen.getByText('Nuevo Reclamo')).toBeInTheDocument();
  });

  it('renders estado filter buttons', async () => {
    await act(async () => {
      render(<ReclamosPage />);
    });
    expect(screen.getByText('Abierto')).toBeInTheDocument();
    expect(screen.getByText('En revisión')).toBeInTheDocument();
  });
});

describe('ReclamosPage — OE9 detalle, resolución y apelación', () => {
  const resolucion = {
    id_resolucion: 10,
    id_mediacion: 'uuid-m',
    tipo_resolucion: 'reembolso_parcial',
    fundamentos: 'Se ordena reembolso parcial según la evidencia',
    plazo_cumplimiento_dias: 5,
    fecha_emision: '2026-09-10T10:00:00Z',
    estado: 'emitida',
    apelaciones: [],
  };

  const base: Reclamo = {
    id_reclamo: 'uuid-1',
    id_transaccion: 'uuid-tx',
    id_reclamante: 'test-user-id',
    id_reclamado: 'uuid-p',
    tipo_reclamo: 'incumplimiento_servicio',
    descripcion: 'El proveedor no realizó el servicio',
    fecha_incidente: '2026-09-01',
    estado: 'resuelto',
    fecha_apertura: '2026-09-02T10:00:00Z',
    fecha_limite_apelacion: '2099-01-01T00:00:00Z',
    prorroga_solicitada: false,
    mediacion_voluntaria_ofrecida: false,
    documentos: [],
    mediacion: {
      id_mediacion: 'uuid-m',
      id_reclamo: 'uuid-1',
      estado: 'resuelta',
      fecha_asignacion: '2026-09-03T10:00:00Z',
      audiencia_virtual: true,
      prorroga_solicitada: false,
      mediacion_voluntaria_ofrecida: false,
      resolucion,
    },
  };

  const ok = (data: unknown) =>
    Promise.resolve({ data: { statusCode: 200, timestamp: '', data } });

  const mockGet = (detalle: Reclamo) => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/reclamos') return ok({ data: [detalle], meta: { total: 1 } });
      if (url === `/reclamos/${detalle.id_reclamo}`) return ok(detalle);
      return ok({ data: [] });
    });
  };

  const abrirDetalle = async () => {
    await act(async () => {
      render(<ReclamosPage />);
    });
    await act(async () => {
      fireEvent.click(screen.getByText('El proveedor no realizó el servicio'));
    });
  };

  it('muestra la resolución y permite apelar dentro del plazo', async () => {
    mockGet(base);
    await abrirDetalle();

    expect(screen.getByText('Resolución')).toBeInTheDocument();
    expect(screen.getByText('Reembolso parcial')).toBeInTheDocument();
    expect(screen.getByText('Emitida')).toBeInTheDocument();
    expect(screen.getByText('Apelar Resolución')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Apelar Resolución'));
    });
    const motivo = screen.getByPlaceholderText(/hubo un error en la interpretación/);
    await act(async () => {
      fireEvent.change(motivo, { target: { value: 'No se consideró evidencia relevante' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Enviar Apelación'));
    });

    expect(api.post).toHaveBeenCalledWith('/apelaciones', {
      id_resolucion: 10,
      id_apelante: 'test-user-id',
      motivo: 'No se consideró evidencia relevante',
    });
  });

  it('no ofrece apelar cuando el plazo de 5 días hábiles está vencido', async () => {
    mockGet({ ...base, fecha_limite_apelacion: '2020-01-01T00:00:00Z' });
    await abrirDetalle();

    expect(screen.getByText('Resolución')).toBeInTheDocument();
    expect(screen.queryByText('Apelar Resolución')).not.toBeInTheDocument();
  });

  it('no ofrece apelar a usuarios que no son partes del reclamo', async () => {
    mockGet({ ...base, id_reclamante: 'otro-1', id_reclamado: 'otro-2' });
    await abrirDetalle();

    expect(screen.getByText('Resolución')).toBeInTheDocument();
    expect(screen.queryByText('Apelar Resolución')).not.toBeInTheDocument();
  });

  it('permite al reclamante desistirse de un reclamo en curso', async () => {
    mockGet({ ...base, estado: 'abierto', fecha_limite_apelacion: undefined, mediacion: undefined });
    await abrirDetalle();

    expect(screen.getByText('Desistir del reclamo')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Desistir del reclamo'));
    });

    expect(api.post).toHaveBeenCalledWith('/reclamos/uuid-1/desistimiento');
  });

  it('registra la primera confirmación de acuerdo sin cerrar el reclamo', async () => {
    mockGet({ ...base, estado: 'en_revision', fecha_limite_apelacion: undefined, mediacion: undefined });
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: {
        statusCode: 200,
        timestamp: '',
        data: { ...base, estado: 'en_revision', id_acuerdo_confirmado_por: 'test-user-id' },
      },
    });

    await abrirDetalle();

    expect(screen.getByText('Acuerdo entre partes')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Acuerdo entre partes'));
    });

    expect(api.post).toHaveBeenCalledWith('/reclamos/uuid-1/acuerdo');
    expect(
      screen.getByText('Acuerdo confirmado. Esperando la confirmación de la contraparte.'),
    ).toBeInTheDocument();
  });

  it('ofrece confirmar el acuerdo cuando la contraparte ya lo hizo', async () => {
    mockGet({
      ...base,
      estado: 'en_revision',
      fecha_limite_apelacion: undefined,
      mediacion: undefined,
      id_acuerdo_confirmado_por: 'uuid-p',
    });
    await abrirDetalle();

    expect(screen.getByText('Confirmar acuerdo')).toBeInTheDocument();
    expect(screen.queryByText('Acuerdo entre partes')).not.toBeInTheDocument();
  });

  it('muestra el motivo de cierre del reclamo', async () => {
    mockGet({
      ...base,
      estado: 'cerrado',
      fecha_limite_apelacion: undefined,
      motivo_cierre: 'acuerdo',
    });
    await abrirDetalle();

    expect(screen.getByText(/Motivo de cierre: Acuerdo entre las partes/)).toBeInTheDocument();
  });

  it('muestra "Iniciar Mediación Formal" al super_admin cuando no hay mediación', async () => {
    const originalImpl = (useAuthStore as unknown as jest.Mock).getMockImplementation();
    (useAuthStore as unknown as jest.Mock).mockImplementation(() => ({
      user: {
        id_usuario: 'admin-id',
        usuario_roles: [{ activo: true, rol: { nombre: 'super_admin' } }],
      },
      isAuthenticated: true,
      isLoading: false,
    }));

    try {
      const enRevision: Reclamo = {
        ...base,
        estado: 'en_revision',
        fecha_limite_apelacion: undefined,
        mediacion: undefined,
      };
      mockGet(enRevision);

      await act(async () => {
        render(<ReclamosPage />);
      });
      await act(async () => {
        fireEvent.click(screen.getByText('El proveedor no realizó el servicio'));
      });

      expect(screen.getByText('Iniciar Mediación Formal')).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByText('Iniciar Mediación Formal'));
      });
      const input = screen.getByPlaceholderText('UUID del mediador');
      await act(async () => {
        fireEvent.change(input, { target: { value: 'uuid-mediador' } });
      });
      await act(async () => {
        fireEvent.click(screen.getByText('Iniciar Mediación'));
      });

      expect(api.post).toHaveBeenCalledWith('/reclamos/uuid-1/mediacion', {
        id_mediador: 'uuid-mediador',
      });
    } finally {
      (useAuthStore as unknown as jest.Mock).mockImplementation(originalImpl);
    }
  });
});

describe('ReclamosPage — solicitud de información adicional (48h)', () => {
  const base: Reclamo = {
    id_reclamo: 'uuid-1',
    id_transaccion: 'uuid-tx',
    id_reclamante: 'test-user-id',
    id_reclamado: 'uuid-p',
    tipo_reclamo: 'incumplimiento_servicio',
    descripcion: 'El proveedor no realizó el servicio',
    fecha_incidente: '2026-09-01',
    estado: 'en_revision',
    fecha_apertura: '2026-09-02T10:00:00Z',
    prorroga_solicitada: false,
    mediacion_voluntaria_ofrecida: false,
    documentos: [],
    solicitudes_info: [],
  };

  const solicitud: SolicitudInfoReclamo = {
    id_solicitud: 5,
    id_reclamo: 'uuid-1',
    id_destinatario: 'test-user-id',
    pregunta: '¿Podés adjuntar la factura del incidente?',
    fecha_solicitud: '2026-10-01T10:00:00Z',
    fecha_limite: '2099-01-01T00:00:00Z',
    estado: 'pendiente',
    respuesta: null,
    fecha_respuesta: null,
  };

  const ok = (data: unknown) =>
    Promise.resolve({ data: { statusCode: 200, timestamp: '', data } });

  const mockGet = (detalle: Reclamo) => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/reclamos') return ok({ data: [detalle], meta: { total: 1 } });
      if (url === `/reclamos/${detalle.id_reclamo}`) return ok(detalle);
      return ok({ data: [] });
    });
  };

  const abrirDetalle = async () => {
    await act(async () => {
      render(<ReclamosPage />);
    });
    await act(async () => {
      fireEvent.click(screen.getByText('El proveedor no realizó el servicio'));
    });
  };

  it('muestra la solicitud pendiente y permite al destinatario responder', async () => {
    mockGet({ ...base, solicitudes_info: [solicitud] });
    await abrirDetalle();

    expect(screen.getByText('Información Adicional')).toBeInTheDocument();
    expect(screen.getByText('¿Podés adjuntar la factura del incidente?')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Escribí tu respuesta...');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Adjunto la factura 123' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Responder'));
    });

    expect(api.post).toHaveBeenCalledWith('/reclamos/uuid-1/solicitudes-info/5/responder', {
      respuesta: 'Adjunto la factura 123',
    });
  });

  it('no ofrece responder cuando la parte no es la destinataria', async () => {
    mockGet({ ...base, solicitudes_info: [{ ...solicitud, id_destinatario: 'uuid-p' }] });
    await abrirDetalle();

    expect(screen.getByText('¿Podés adjuntar la factura del incidente?')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Escribí tu respuesta...')).not.toBeInTheDocument();
  });

  it('marca como vencida una solicitud pendiente fuera de plazo', async () => {
    mockGet({
      ...base,
      solicitudes_info: [{ ...solicitud, fecha_limite: '2020-01-01T00:00:00Z' }],
    });
    await abrirDetalle();

    expect(screen.getByText('Vencida')).toBeInTheDocument();
    expect(screen.queryByText('Pendiente')).not.toBeInTheDocument();
  });

  it('muestra la respuesta registrada de una solicitud respondida', async () => {
    mockGet({
      ...base,
      solicitudes_info: [
        {
          ...solicitud,
          estado: 'respondida',
          respuesta: 'Acá está la factura',
          fecha_respuesta: '2026-10-02T10:00:00Z',
        },
      ],
    });
    await abrirDetalle();

    expect(screen.getByText('Respondida')).toBeInTheDocument();
    expect(screen.getByText('Acá está la factura')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Escribí tu respuesta...')).not.toBeInTheDocument();
  });

  it('permite al super_admin solicitar información con plazo de 48 horas', async () => {
    const originalImpl = (useAuthStore as unknown as jest.Mock).getMockImplementation();
    (useAuthStore as unknown as jest.Mock).mockImplementation(() => ({
      user: {
        id_usuario: 'admin-id',
        usuario_roles: [{ activo: true, rol: { nombre: 'super_admin' } }],
      },
      isAuthenticated: true,
      isLoading: false,
    }));

    try {
      mockGet({ ...base });
      await abrirDetalle();

      expect(screen.getByText('Solicitar información')).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByText('Solicitar información'));
      });
      const select = screen.getByDisplayValue('Seleccionar parte...');
      await act(async () => {
        fireEvent.change(select, { target: { value: 'uuid-p' } });
      });
      const textarea = screen.getByPlaceholderText('Solicitá la información necesaria...');
      await act(async () => {
        fireEvent.change(textarea, { target: { value: '¿Tenés el comprobante de pago?' } });
      });
      await act(async () => {
        fireEvent.click(screen.getByText('Enviar Solicitud'));
      });

      expect(api.post).toHaveBeenCalledWith('/reclamos/uuid-1/solicitudes-info', {
        id_destinatario: 'uuid-p',
        pregunta: '¿Tenés el comprobante de pago?',
      });
    } finally {
      (useAuthStore as unknown as jest.Mock).mockImplementation(originalImpl);
    }
  });

  it('no ofrece solicitar información a usuarios que no son super_admin', async () => {
    mockGet({ ...base });
    await abrirDetalle();

    expect(screen.queryByText('Solicitar información')).not.toBeInTheDocument();
  });
});
