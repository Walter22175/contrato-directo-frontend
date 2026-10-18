/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act, fireEvent } from '@testing-library/react';
import CambiosPlataformaLanding from '@/components/novedades/CambiosPlataformaLanding';
import api from '@/lib/api';

const authStore: {
  user: {
    usuario_roles?: Array<{ activo: boolean; rol: { nombre: string } }>;
  } | null;
} = jest.requireMock('@/store/auth').useAuthStore.getState();

const rolesOriginales = authStore.user?.usuario_roles;

const setRoles = (nombres: string[]) => {
  if (authStore.user) {
    authStore.user.usuario_roles = nombres.map((nombre) => ({
      activo: true,
      rol: { nombre },
    }));
  }
};

describe('CambiosPlataformaLanding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setRoles(['cliente']);
  });

  afterEach(() => {
    if (authStore.user) {
      authStore.user.usuario_roles = rolesOriginales;
    }
  });

  it('muestra el hero con título y subtítulo', async () => {
    await act(async () => {
      render(<CambiosPlataformaLanding />);
    });
    expect(
      screen.getByRole('heading', { level: 1, name: /qué cambió en la plataforma/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/todas las mejoras recientes en un solo lugar/i),
    ).toBeInTheDocument();
  });

  it('renderiza las secciones principales', async () => {
    await act(async () => {
      render(<CambiosPlataformaLanding />);
    });
    expect(
      screen.getByRole('heading', { name: /pagos y seguridad/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Marketplace' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /comienzo del servicio \+ anticipo del 30%/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /novedades recientes/i }),
    ).toBeInTheDocument();
  });

  it('incluye las 5 cards de novedades con sus links', async () => {
    await act(async () => {
      render(<CambiosPlataformaLanding />);
    });
    const links: Array<[RegExp, string]> = [
      [/anticipo del 30% para servicios largos/i, '/novedades/anticipo-30'],
      [/guía del comienzo del servicio/i, '/ayuda/comienzo-del-servicio'],
      [/retención y liberación de pagos/i, '/ayuda/retencion-liberacion'],
      [/panel admin de mercado pago/i, '/dashboard/admin/mercado-pago'],
      [/panel admin de inicio del servicio/i, '/dashboard/admin/inicio-servicio'],
    ];
    for (const [nombre, href] of links) {
      expect(screen.getByRole('link', { name: nombre })).toHaveAttribute('href', href);
    }
  });

  it('muestra los CTA principales y oculta el de admin sin rol super_admin', async () => {
    await act(async () => {
      render(<CambiosPlataformaLanding />);
    });
    expect(
      screen.getByRole('link', { name: /ver mis transacciones/i }),
    ).toHaveAttribute('href', '/dashboard/transacciones');
    expect(
      screen.getByRole('link', { name: /conectar mercado pago/i }),
    ).toHaveAttribute('href', '/dashboard/mercado-pago');
    expect(
      screen.queryByRole('link', { name: /ir al panel admin/i }),
    ).not.toBeInTheDocument();
  });

  it('muestra el CTA de admin con rol super_admin', async () => {
    setRoles(['super_admin']);
    await act(async () => {
      render(<CambiosPlataformaLanding />);
    });
    expect(
      screen.getByRole('link', { name: /ir al panel admin/i }),
    ).toHaveAttribute('href', '/dashboard/admin');
  });

  it('carga y filtra las FAQs de pagos', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        statusCode: 200,
        timestamp: '',
        data: [
          {
            id_faq: 1,
            pregunta: '¿Qué es la retención de pagos?',
            respuesta: 'Los fondos permanecen en custodia hasta la resolución.',
          },
          {
            id_faq: 2,
            pregunta: '¿Cómo contacto al equipo?',
            respuesta: 'Desde el formulario de contacto del sitio.',
          },
        ],
      },
    });
    await act(async () => {
      render(<CambiosPlataformaLanding />);
    });

    expect(await screen.findByText('¿Qué es la retención de pagos?')).toBeInTheDocument();
    expect(screen.queryByText('¿Cómo contacto al equipo?')).not.toBeInTheDocument();
  });

  it('abre y cierra una FAQ al hacer click', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        statusCode: 200,
        timestamp: '',
        data: [
          {
            id_faq: 10,
            pregunta: '¿Cuándo se libera el pago conforme?',
            respuesta: 'En 24 horas hábiles desde la conformidad.',
          },
        ],
      },
    });
    await act(async () => {
      render(<CambiosPlataformaLanding />);
    });

    const btn = await screen.findByRole('button', {
      name: /cuándo se libera el pago conforme/i,
    });
    fireEvent.click(btn);
    expect(
      screen.getByText(/24 horas hábiles desde la conformidad/i),
    ).toBeInTheDocument();
    fireEvent.click(btn);
    expect(
      screen.queryByText(/24 horas hábiles desde la conformidad/i),
    ).not.toBeInTheDocument();
  });
});
