import React from 'react';

jest.mock('next/navigation', () => {
  const router = { push: jest.fn(), back: jest.fn(), refresh: jest.fn(), replace: jest.fn() };
  let cachedParams: URLSearchParams | null = null;
  let cachedSource: string | null = null;
  return {
    useRouter: () => router,
    useSearchParams: () => {
      const src = (globalThis as { __MOCK_SEARCH_PARAMS__?: string }).__MOCK_SEARCH_PARAMS__ || '';
      if (!cachedParams || cachedSource !== src) {
        cachedParams = new URLSearchParams(src);
        cachedSource = src;
      }
      return cachedParams;
    },
    usePathname: () => '',
    useParams: () => ({ id: 'test-id' }),
  };
});

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

const mockUser = {
  id_usuario: 'test-user-id',
  email: 'test@test.com',
  nombre: 'Test',
  apellido: 'User',
  tipo_persona: 'fisica',
  estado: 'activo',
  email_verificado: true,
  fecha_registro: '2026-01-01T00:00:00Z',
  telefono: '+54 11 1234-5678',
  direccion: 'Calle Falsa 123',
  cuit_cuil: '20304050607',
  dni: '30405060',
  usuario_roles: [{ activo: true, rol: { nombre: 'cliente' } }],
};

const mockStore = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  logout: jest.fn(),
  login: jest.fn(),
  register: jest.fn(),
  loadUser: jest.fn(),
  clearError: jest.fn(),
  cambiarContexto: jest.fn(() => Promise.resolve('cliente')),
  error: null,
};

jest.mock('@/store/auth', () => ({
  useAuthStore: Object.assign(
    jest.fn(<T,>(selector?: (state: typeof mockStore) => T) => {
      return selector ? selector(mockStore) : mockStore;
    }),
    { getState: jest.fn(() => mockStore) }
  ),
}));

jest.mock('@/lib/api', () => {
  const mockExtract = (response: { data: unknown }) => {
    const raw = response.data;
    if (raw && typeof raw === 'object' && 'data' in raw && 'timestamp' in raw) {
      return raw.data;
    }
    return raw;
  };
  return {
    __esModule: true,
    default: {
      get: jest.fn(() => Promise.resolve({ data: { statusCode: 200, timestamp: '', data: { data: [], meta: { total: 0 } } } })),
      post: jest.fn(() => Promise.resolve({ data: { statusCode: 200, timestamp: '', data: {} } })),
      patch: jest.fn(() => Promise.resolve({ data: { statusCode: 200, timestamp: '', data: {} } })),
      delete: jest.fn(() => Promise.resolve({ data: { statusCode: 200, timestamp: '', data: {} } })),
    },
    extractData: jest.fn(mockExtract),
    mensajeError: jest.fn((error: unknown, fallback = 'Error inesperado') => {
      const e = error as { response?: { data?: { message?: string | string[] } }; message?: string };
      const msg = e?.response?.data?.message;
      if (Array.isArray(msg)) return msg.join(', ');
      if (typeof msg === 'string' && msg) return msg;
      if (error instanceof Error && error.message) return error.message;
      return fallback;
    }),
  };
});
