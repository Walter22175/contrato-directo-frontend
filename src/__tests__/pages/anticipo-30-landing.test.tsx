/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import Anticipo30Landing from '@/components/novedades/Anticipo30Landing';
import api from '@/lib/api';

const faqsMock = [
  {
    id_faq: 100,
    categoria: 'Pagos',
    pregunta: '¿Por qué tengo que notificar el inicio del servicio?',
    respuesta:
      'Para servicios de más de 3 días existe la liberación anticipada del 30%: se libera cuando ambas partes notifican que el trabajo empezó.',
    orden: 16,
    activo: true,
    veces_consultado: 0,
  },
  {
    id_faq: 102,
    categoria: 'Pagos',
    pregunta: '¿Cuándo se libera el 30% anticipado?',
    respuesta:
      'Se libera automáticamente a las 72 horas calendario desde el inicio efectivo, siempre en horario bancario hábil.',
    orden: 18,
    activo: true,
    veces_consultado: 0,
  },
  {
    id_faq: 500,
    categoria: 'Cuenta',
    pregunta: '¿Cómo actualizo mi contraseña?',
    respuesta: 'Desde tu perfil podés cambiarla en cualquier momento.',
    orden: 2,
    activo: true,
    veces_consultado: 0,
  },
];

describe('Anticipo30Landing', () => {
  it('renders hero con título y subtítulo', async () => {
    await act(async () => {
      render(<Anticipo30Landing />);
    });
    expect(
      screen.getByRole('heading', { name: /nuevo anticipo del 30%/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/más seguridad, más transparencia, mejor flujo de trabajo/i),
    ).toBeInTheDocument();
  });

  it('presenta los tres pasos de cómo funciona', async () => {
    await act(async () => {
      render(<Anticipo30Landing />);
    });
    expect(
      screen.getByRole('heading', { name: /cliente y proveedor notifican el comienzo/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /inicio efectivo = segunda notificación/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /72 h después: liberación del 30%/i }),
    ).toBeInTheDocument();
  });

  it('presenta beneficios para proveedores y clientes en dos columnas', async () => {
    await act(async () => {
      render(<Anticipo30Landing />);
    });
    expect(
      screen.getByRole('heading', { name: /para proveedores/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /para clientes/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/flujo de caja mejorado/i)).toBeInTheDocument();
    expect(screen.getByText(/transparencia total/i)).toBeInTheDocument();
    expect(
      screen.getByText(/compatible con hitos y marketplace/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/control sobre el inicio real/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/el 70% sigue retenido/i)).toBeInTheDocument();
    expect(screen.getByText(/seguridad y trazabilidad/i)).toBeInTheDocument();
  });

  it('muestra las FAQs del anuncio y permite abrirlas', async () => {
    jest
      .spyOn(api, 'get')
      .mockResolvedValueOnce({ data: { data: faqsMock } } as unknown as {
        data: unknown;
      });

    await act(async () => {
      render(<Anticipo30Landing />);
    });

    await waitFor(() => {
      expect(
        screen.getByText('¿Por qué tengo que notificar el inicio del servicio?'),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText('¿Cuándo se libera el 30% anticipado?'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('¿Cómo actualizo mi contraseña?'),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByText('¿Cuándo se libera el 30% anticipado?'),
    );
    expect(
      screen.getByText(/siempre en horario bancario hábil/i),
    ).toBeInTheDocument();
  });

  it('incluye los CTAs de transacciones y Mercado Pago', async () => {
    await act(async () => {
      render(<Anticipo30Landing />);
    });
    const ctasTransacciones = screen.getAllByRole('link', {
      name: /ver mis transacciones/i,
    });
    expect(ctasTransacciones.length).toBeGreaterThanOrEqual(1);
    expect(ctasTransacciones[0]).toHaveAttribute(
      'href',
      '/dashboard/transacciones',
    );
    const ctasMp = screen.getAllByRole('link', {
      name: /conectar mercado pago/i,
    });
    expect(ctasMp.length).toBeGreaterThanOrEqual(1);
    expect(ctasMp[0]).toHaveAttribute('href', '/dashboard/mercado-pago');
  });
});
