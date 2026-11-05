'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';
import {
  LayoutDashboard,
  Search,
  FileText,
  CreditCard,

  MessageSquare,
  HelpCircle,
  Settings,
  Users,
  BarChart3,
  Bell,
  AlertTriangle,
  Scale,
  Shield,
  Phone,
  Clock,
  Activity,
  UserCheck,
  FileBarChart,
  Image as ImageIcon,
  Briefcase,
  LogOut,
  Wallet,
  Handshake,
  KeyRound,
  Gauge,
  BookOpen,
} from 'lucide-react';
import { LlaveIcon } from '@/components/ui/LlaveIcon';

const clientLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/servicios', label: 'Buscar Servicios', icon: Search },
  { href: '/dashboard/transacciones', label: 'Mis Transacciones', icon: CreditCard },
  { href: '/dashboard/contratos', label: 'Mis Contratos', icon: FileText },
  { href: '/dashboard/documentos', label: 'Documentos', icon: FileText },
  { href: '/dashboard/valoraciones', label: 'Mis Valoraciones', icon: LlaveIcon },
  { href: '/dashboard/reclamos', label: 'Reclamos', icon: AlertTriangle },
  { href: '/dashboard/notificaciones', label: 'Notificaciones', icon: Bell },
  { href: '/dashboard/tickets', label: 'Soporte', icon: MessageSquare },
  { href: '/dashboard/sla', label: 'Estado SLA', icon: Clock },
  { href: '/contacto', label: 'Contacto', icon: Phone },
  { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
  { href: '/ayuda', label: 'Centro de Ayuda', icon: HelpCircle },
];

const providerLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/mis-servicios', label: 'Mis Servicios', icon: Settings },
  { href: '/dashboard/transacciones', label: 'Transacciones', icon: CreditCard },
  { href: '/dashboard/inicio-servicio', label: 'Anticipo 30%', icon: Handshake },
  { href: '/dashboard/contratos', label: 'Contratos', icon: FileText },
  { href: '/dashboard/documentos', label: 'Documentos', icon: FileText },
  { href: '/dashboard/valoraciones', label: 'Valoraciones', icon: LlaveIcon },
  { href: '/dashboard/mercado-pago', label: 'Mercado Pago', icon: Wallet },
  { href: '/dashboard/reclamos', label: 'Reclamos', icon: AlertTriangle },
  { href: '/dashboard/notificaciones', label: 'Notificaciones', icon: Bell },
  { href: '/dashboard/tickets', label: 'Soporte', icon: MessageSquare },
  { href: '/dashboard/sla', label: 'Estado SLA', icon: Clock },
  { href: '/contacto', label: 'Contacto', icon: Phone },
  { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
];

const adminLinks = [
  { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/admin/control-total', label: 'Control Total', icon: Gauge },
  { href: '/dashboard/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/dashboard/admin/roles', label: 'Roles', icon: KeyRound },
  { href: '/dashboard/admin/configuracion', label: 'Config. Sistema', icon: Settings },
  { href: '/dashboard/admin/promociones', label: 'Promociones', icon: ImageIcon },
  { href: '/dashboard/admin/servicios', label: 'Gestión de Servicios', icon: Briefcase },
  { href: '/dashboard/admin/reportes', label: 'Reportes', icon: BarChart3 },
  { href: '/dashboard/admin/reportes/trimestral', label: 'Reporte Trimestral', icon: FileBarChart },
  { href: '/dashboard/admin/metricas', label: 'Métricas de Atención', icon: Activity },
  { href: '/dashboard/admin/inicio-servicio', label: 'Anticipo 30%', icon: Handshake },
  { href: '/dashboard/admin/mercado-pago', label: 'Mercado Pago', icon: Wallet },
  { href: '/dashboard/admin/agentes', label: 'Agentes de Soporte', icon: UserCheck },
  { href: '/dashboard/sla', label: 'Gestión SLA', icon: Clock },
  { href: '/dashboard/reclamos', label: 'Reclamos', icon: AlertTriangle },
  { href: '/dashboard/mediacion', label: 'Mediación', icon: Scale },
  { href: '/dashboard/sanciones', label: 'Sanciones', icon: Shield },
  { href: '/dashboard/notificaciones', label: 'Notificaciones', icon: Bell },
  { href: '/ayuda/interno/manual-soporte', label: 'Manual de Soporte', icon: BookOpen },
  { href: '/ayuda', label: 'Centro de Ayuda', icon: HelpCircle },
  { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
];

export default function Sidebar({ role = 'cliente' }: { role?: string }) {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const abierta = useUiStore((s) => s.sidebarAbierta);
  const cerrar = useUiStore((s) => s.cerrarSidebar);
  const links = role === 'admin' ? adminLinks : role === 'proveedor' ? providerLinks : clientLinks;
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const centrarItem = (href: string) => {
    const nav = navRef.current;
    const el = itemRefs.current[href];
    if (!nav || !el) return;
    const top = Math.max(0, el.offsetTop - nav.clientHeight / 2 + el.clientHeight / 2);
    if (typeof nav.scrollTo === 'function') {
      nav.scrollTo({ top, behavior: 'smooth' });
    } else {
      nav.scrollTop = top;
    }
  };

  useEffect(() => {
    centrarItem(pathname);
  }, [pathname]);

  return (
    <>
      {abierta && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={cerrar}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-[var(--header-height)] bottom-0 z-40 flex w-64 flex-col border-r border-inkline-violet/60 bg-deep-indigo transition-transform duration-200',
          abierta ? 'translate-x-0' : '-translate-x-full',
          'md:z-30 md:translate-x-0',
        )}
      >
        <nav
          ref={navRef}
          className="relative p-4 space-y-1 flex-1 overflow-y-auto overflow-x-hidden"
        >
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                ref={(el) => {
                  itemRefs.current[link.href] = el;
                }}
                onClick={() => {
                  cerrar();
                  centrarItem(link.href);
                }}
                className={cn(
                  'flex items-center gap-3 rounded-full border px-4 py-2.5 text-sm font-light transition-colors',
                  isActive
                    ? 'border-pulse-cobalt/50 bg-pulse-cobalt/15 text-white'
                    : 'border-transparent text-quartz-lavender hover:border-inkline-violet hover:bg-white/5 hover:text-white',
                )}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-3 border-t border-inkline-violet/60 p-4">
          <p className="text-center text-[10px] uppercase tracking-[0.25em] text-quartz-lavender">Contrato Directo</p>
          <button
            onClick={() => {
              logout();
              cerrar();
            }}
            className="flex w-full items-center gap-3 rounded-full border border-transparent px-4 py-2.5 text-sm font-light text-quartz-lavender transition-colors hover:border-inkline-violet hover:bg-white/5 hover:text-white md:hidden"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
