import React from 'react';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), refresh: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
}));

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: any) => (
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
  usuario_roles: [{ rol: { nombre: 'cliente' } }],
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
  error: null,
};

jest.mock('@/store/auth', () => ({
  useAuthStore: Object.assign(
    jest.fn((selector?: (state: typeof mockStore) => any) => {
      return selector ? selector(mockStore) : mockStore;
    }),
    { getState: jest.fn(() => mockStore) }
  ),
}));

jest.mock('@/lib/api', () => {
  const mockExtract = (response: { data: any }) => {
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
    },
    extractData: jest.fn(mockExtract),
  };
});
