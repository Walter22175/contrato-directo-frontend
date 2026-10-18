/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act } from '@testing-library/react';
import ManualSoportePage from '@/app/ayuda/interno/manual-soporte/page';
import InternoLayout from '@/app/ayuda/interno/layout';

const renderManual = async () => {
  await act(async () => {
    render(
      <InternoLayout>
        <ManualSoportePage />
      </InternoLayout>,
    );
  });
};

const authStore: {
  user: {
    usuario_roles?: Array<{ activo: boolean; rol: { nombre: string } }>;
  } | null;
} = jest.requireMock('@/store/auth').useAuthStore.getState();

const routerMock = jest.requireMock('next/navigation').useRouter();

const rolesOriginales = authStore.user?.usuario_roles;

const setRoles = (nombres: string[]) => {
  if (authStore.user) {
    authStore.user.usuario_roles = nombres.map((nombre) => ({
      activo: true,
      rol: { nombre },
    }));
  }
};

describe('ManualSoportePage (acceso interno)', () => {
  beforeEach(() => {
    routerMock.push.mockClear();
  });

  afterEach(() => {
    if (authStore.user) {
      authStore.user.usuario_roles = rolesOriginales;
    }
  });

  it('oculta el manual y redirige sin rol de soporte', async () => {
    setRoles(['cliente']);
    await renderManual();
    expect(routerMock.push).toHaveBeenCalledWith('/dashboard');
    expect(
      screen.queryByText(/manual de soporte: comienzo notificado/i),
    ).not.toBeInTheDocument();
  });

  it('muestra el manual para super_admin', async () => {
    setRoles(['super_admin']);
    await renderManual();
    expect(routerMock.push).not.toHaveBeenCalled();
    expect(
      screen.getByText(/manual de soporte: comienzo notificado/i),
    ).toBeInTheDocument();
  });

  it('muestra el manual para roles de atención', async () => {
    setRoles(['agente_atencion']);
    await renderManual();
    expect(
      screen.getByText(/manual de soporte: comienzo notificado/i),
    ).toBeInTheDocument();
  });
});

describe('ManualSoportePage (contenido)', () => {
  beforeEach(() => {
    setRoles(['super_admin']);
    routerMock.push.mockClear();
  });

  afterEach(() => {
    if (authStore.user) {
      authStore.user.usuario_roles = rolesOriginales;
    }
  });

  it('renderiza las 6 secciones del manual', async () => {
    await renderManual();
    expect(
      screen.getByRole('heading', { level: 2, name: /1\. comienzo del servicio/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /2\. liberación anticipada del 30%/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /3\. resto del pago/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /4\. marketplace y tokens/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /5\. herramientas del soporte/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /6\. checklist de resolución rápida/i }),
    ).toBeInTheDocument();
  });

  it('incluye el checklist de resolución rápida con los 5 casos', async () => {
    await renderManual();
    expect(screen.getByText('Inicio no confirmado')).toBeInTheDocument();
    expect(screen.getByText('Anticipo no liberado')).toBeInTheDocument();
    expect(screen.getAllByText('Token inválido').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Marketplace deshabilitado').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Disputa')).toBeInTheDocument();
  });

  it('explica el inicio efectivo como segunda notificación y las 72 h en horario hábil', async () => {
    await renderManual();
    expect(
      screen.getAllByText(/segunda notificación/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/horario bancario hábil/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/fecha_liberacion_anticipada_at/i).length,
    ).toBeGreaterThanOrEqual(1);
  });
});
