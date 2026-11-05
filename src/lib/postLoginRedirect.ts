const KEY = 'post_login_redirect';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function esDestinoValido(destino: string | null | undefined): destino is string {
  return !!destino && destino.startsWith('/') && !destino.startsWith('//');
}

export function guardarDestinoPostLogin(destino: string) {
  if (typeof window === 'undefined' || !esDestinoValido(destino)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ destino, ts: Date.now() }));
  } catch {
    // Sin storage disponible el flujo sigue funcionando con ?next=.
  }
}

export function obtenerDestinoPostLogin(
  explicito?: string | null,
): string | null {
  if (typeof window === 'undefined') return null;
  if (esDestinoValido(explicito)) return explicito;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { destino?: string; ts?: number };
    if (!esDestinoValido(data.destino)) {
      localStorage.removeItem(KEY);
      return null;
    }
    if (!data.ts || Date.now() - data.ts > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return data.destino;
  } catch {
    return null;
  }
}

export function limpiarDestinoPostLogin() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nada que limpiar.
  }
}
