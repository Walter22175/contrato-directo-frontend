/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import VerificarFirmaPage from '@/app/verificar-firma/page';

const HASH = 'a3f9c8d1e4b2c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e';

const resultadoEncontrado = {
  encontrado: true,
  hash_consultado: HASH,
  id_contrato: 'uuid-contrato-1',
  tipo_contrato: 'servicio',
  estado: 'firmado',
  fecha_generacion: '2026-10-01T00:00:00Z',
  fecha_firma_cliente: '2026-10-25T00:00:00Z',
  fecha_firma_proveedor: '2026-10-26T00:00:00Z',
  hash_documento: HASH,
  firmas_registradas: 1,
  firmas: [
    {
      id_firma: 'f-1',
      id_usuario: 'user-1',
      nombre: 'Juan Perez',
      email: 'juan@example.com',
      fecha_firma: '2026-10-26T12:00:00Z',
      ip_firma: '181.31.XX.XX',
      proveedor_firma: 'docusign',
      hash_documento: HASH,
      estado: 'exitosa',
    },
  ],
  url_pdf_firmado: 'https://s3.test/firmado.pdf',
  verificado_en: '2026-10-26T15:00:00Z',
};

function submitHash(valor: string, container: HTMLElement) {
  fireEvent.change(screen.getByLabelText('Hash SHA-256'), { target: { value: valor } });
  fireEvent.submit(container.querySelector('form')!);
}

describe('VerificarFirmaPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete (globalThis as { __MOCK_SEARCH_PARAMS__?: string }).__MOCK_SEARCH_PARAMS__;
  });

  it('renderiza el título, el input y el botón', async () => {
    await act(async () => {
      render(<VerificarFirmaPage />);
    });

    expect(screen.getByText('Verificador de Evidencia')).toBeInTheDocument();
    expect(screen.getByLabelText('Hash SHA-256')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verificar/ })).toBeInTheDocument();
  });

  it('rechaza un hash inválido sin llamar a la API', async () => {
    const { container } = await act(async () => render(<VerificarFirmaPage />));

    await act(async () => {
      submitHash('no-es-un-hash', container);
    });

    expect(
      screen.getByText('Ingresá un hash SHA-256 válido (64 caracteres hexadecimales).'),
    ).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
  });

  it('muestra la evidencia completa cuando el hash es válido', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: { statusCode: 200, timestamp: '', data: resultadoEncontrado },
    });

    const { container } = await act(async () => render(<VerificarFirmaPage />));

    await act(async () => {
      submitHash(HASH.toUpperCase(), container);
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(`/contratos/verificar?hash=${HASH}`);
    });

    expect(await screen.findByText('Contrato Válido')).toBeInTheDocument();
    expect(screen.getByText('uuid-contrato-1')).toBeInTheDocument();
    // Evidencia del firmante
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('juan@example.com')).toBeInTheDocument();
    expect(screen.getByText(/181\.31\.XX\.XX/)).toBeInTheDocument();
    expect(screen.getByText(/docusign/)).toBeInTheDocument();
    // PDF firmado
    expect(screen.getByText('Descargar PDF firmado')).toBeInTheDocument();
    // Usuario autenticado (mock del setup): ve "Ver contrato"
    expect(screen.getByText('Ver contrato')).toBeInTheDocument();
  });

  it('muestra estado no encontrado cuando el hash no existe', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        statusCode: 200,
        timestamp: '',
        data: { encontrado: false, hash_consultado: HASH, verificado_en: '2026-10-26T15:00:00Z' },
      },
    });

    const { container } = await act(async () => render(<VerificarFirmaPage />));

    await act(async () => {
      submitHash(HASH, container);
    });

    expect(
      await screen.findByText('No se encontró evidencia para este hash'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Descargar PDF firmado')).not.toBeInTheDocument();
  });

  it('oculta el botón Ver contrato cuando no hay sesión', async () => {
    const storeSinSesion = { user: null, isAuthenticated: false };
    (useAuthStore as unknown as jest.Mock).mockImplementation(
      (selector?: (s: typeof storeSinSesion) => unknown) =>
        selector ? selector(storeSinSesion) : storeSinSesion,
    );

    (api.get as jest.Mock).mockResolvedValue({
      data: { statusCode: 200, timestamp: '', data: resultadoEncontrado },
    });

    const { container } = await act(async () => render(<VerificarFirmaPage />));

    await act(async () => {
      submitHash(HASH, container);
    });

    expect(await screen.findByText('Contrato Válido')).toBeInTheDocument();
    expect(screen.queryByText('Ver contrato')).not.toBeInTheDocument();
    // El PDF sigue disponible sin sesión
    expect(screen.getByText('Descargar PDF firmado')).toBeInTheDocument();
  });

  it('auto-carga el hash desde la URL (escaneo de QR) sin tipear nada', async () => {
    (globalThis as { __MOCK_SEARCH_PARAMS__?: string }).__MOCK_SEARCH_PARAMS__ = `?hash=${HASH}`;

    (api.get as jest.Mock).mockResolvedValue({
      data: { statusCode: 200, timestamp: '', data: resultadoEncontrado },
    });

    await act(async () => {
      render(<VerificarFirmaPage />);
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(`/contratos/verificar?hash=${HASH}`);
    });

    expect(await screen.findByText('Contrato Válido')).toBeInTheDocument();
    expect(screen.getByLabelText('Hash SHA-256')).toHaveValue(HASH);
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
  });

  it('muestra error si el hash de la URL no es válido y no llama a la API', async () => {
    (globalThis as { __MOCK_SEARCH_PARAMS__?: string }).__MOCK_SEARCH_PARAMS__ = '?hash=malísimo';

    await act(async () => {
      render(<VerificarFirmaPage />);
    });

    expect(
      await screen.findByText('El hash recibido en el enlace no es válido.'),
    ).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
  });
});
