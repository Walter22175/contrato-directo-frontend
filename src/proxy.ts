import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const authRoutes = ['/auth/login', '/auth/register'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  if (authRoutes.some((route) => pathname.startsWith(route))) {
    // Solo forzar /dashboard con sesión visible (cookie de access_token).
    // La refresh_token sola no alcanza: si no, a los 15 min (cuando expira
    // el access) o tras un logout incompleto, el login queda inalcanzable.
    if (token) {
      const next = request.nextUrl.searchParams.get('next');
      const destino =
        next && next.startsWith('/') && !next.startsWith('//')
          ? next
          : '/dashboard';
      return NextResponse.redirect(new URL(destino, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/auth/:path*'],
};
