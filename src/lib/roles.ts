import type { Usuario } from '@/types';

/** Roles con acceso al area de administracion. */
export const ROLES_ADMIN = [
  'super_admin',
  'sistemas',
  'admin_comercial',
  'admin_contable',
  'agente_atencion',
] as const;

export type RolAdmin = (typeof ROLES_ADMIN)[number];

const ROLES_TOTALES: RolAdmin[] = ['super_admin', 'sistemas'];

/** Paginas sensibles reservadas a super_admin y sistemas. */
const RUTAS_TOTALES = [
  '/dashboard/admin/control-total',
  '/dashboard/admin/usuarios',
  '/dashboard/admin/roles',
  '/dashboard/admin/configuracion',
  '/dashboard/admin/mercado-pago',
];

/** Paginas comerciales / contenido. */
const RUTAS_COMERCIAL = [
  '/dashboard/admin',
  '/dashboard/admin/promociones',
  '/dashboard/admin/servicios',
  '/dashboard/admin/reportes',
  '/dashboard/admin/metricas',
  '/dashboard/admin/inicio-servicio',
  '/dashboard/admin/agentes',
  '/dashboard/admin/tutoriales',
  '/dashboard/admin/plantillas',
  '/dashboard/admin/feriados',
];

/** Paginas financieras / contables. */
const RUTAS_CONTABLE = [
  '/dashboard/admin',
  '/dashboard/admin/reportes',
  '/dashboard/admin/metricas',
  '/dashboard/admin/mercado-pago',
  '/dashboard/admin/inicio-servicio',
  '/dashboard/admin/feriados',
];

/** Paginas de soporte / atencion. */
const RUTAS_SOPORTE = [
  '/dashboard/admin',
  '/dashboard/admin/metricas',
  '/dashboard/admin/agentes',
  '/dashboard/admin/tutoriales',
  '/dashboard/admin/reportes',
];

export function getRolesActivos(user?: Partial<Usuario> | null): string[] {
  return (user?.usuario_roles || [])
    .filter((ur) => ur.activo)
    .map((ur) => ur.rol?.nombre as string)
    .filter(Boolean);
}

export function tieneRolAdmin(roles: string[]): boolean {
  return roles.some((rol) => (ROLES_ADMIN as readonly string[]).includes(rol));
}

export function esRolTotal(roles: string[]): boolean {
  return roles.some((rol) => ROLES_TOTALES.includes(rol as RolAdmin));
}

function coincideRuta(pathname: string, permitidas: string[]): boolean {
  return permitidas.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`),
  );
}

/**
 * Define si un usuario con estos roles puede abrir una ruta del area admin.
 * super_admin y sistemas acceden a todo; el resto solo a su modulo.
 */
export function puedeAccederAdmin(pathname: string, roles: string[]): boolean {
  if (!tieneRolAdmin(roles)) return false;
  if (esRolTotal(roles)) return true;

  if (coincideRuta(pathname, RUTAS_TOTALES)) return false;

  if (roles.includes('admin_comercial') && coincideRuta(pathname, RUTAS_COMERCIAL)) {
    return true;
  }
  if (roles.includes('admin_contable') && coincideRuta(pathname, RUTAS_CONTABLE)) {
    return true;
  }
  if (roles.includes('agente_atencion') && coincideRuta(pathname, RUTAS_SOPORTE)) {
    return true;
  }

  return false;
}
