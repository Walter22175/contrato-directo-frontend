import type { NextRequest } from 'next/server';

const mockRedirect = jest.fn((url: URL) => ({ status: 307, headers: { location: url.pathname } }));
const mockNext = jest.fn(() => ({ status: 200, headers: { location: null } }));

jest.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: URL) => mockRedirect(url),
    next: () => mockNext(),
  },
}));

import { proxy } from '@/proxy';

function makeRequest(path: string, cookieHeader?: string): NextRequest {
  const cookies = new Map<string, string>();
  cookieHeader?.split(';').forEach((par) => {
    const [k, ...v] = par.trim().split('=');
    if (k) cookies.set(k, v.join('='));
  });
  return {
    url: `http://localhost:3000${path}`,
    nextUrl: new URL(`http://localhost:3000${path}`),
    cookies: {
      get: (name: string) =>
        cookies.has(name) ? { value: cookies.get(name) } : undefined,
    },
  } as unknown as NextRequest;
}

describe('proxy (guard de rutas de auth)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirige /auth/login a /dashboard cuando existe la cookie access_token', () => {
    proxy(makeRequest('/auth/login', 'access_token=abc'));
    expect(mockRedirect).toHaveBeenCalledTimes(1);
    expect(mockRedirect.mock.calls[0][0].pathname).toBe('/dashboard');
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('permite /auth/forgot-password aunque exista access_token (recuperación siempre accesible)', () => {
    proxy(makeRequest('/auth/forgot-password', 'access_token=abc'));
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('permite /auth/login cuando solo queda la refresh_token (access expirado a los 15 min)', () => {
    proxy(makeRequest('/auth/login', 'refresh_token=xyz'));
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('permite /auth/login sin cookies (tras logout)', () => {
    proxy(makeRequest('/auth/login'));
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('no intercepta rutas fuera de /auth', () => {
    proxy(makeRequest('/dashboard', 'access_token=abc'));
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
