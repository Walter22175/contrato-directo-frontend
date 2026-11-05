'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { MessageCircle, Mail, Phone, MapPin } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0z" />
    </svg>
  );
}

export default function Footer() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  const esRutaDashboard =
    pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  const esAdmin = (user?.usuario_roles || []).some(
    (ur) =>
      ur.activo &&
      (ur.rol?.nombre === 'super_admin' || ur.rol?.nombre === 'sistemas'),
  );

  if (
    pathname.startsWith('/dashboard/admin') ||
    (esRutaDashboard && (isLoading || esAdmin))
  ) {
    return null;
  }

  return (
    <footer className="border-t border-inkline-violet/60 bg-deep-indigo">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 transition-transform duration-200 hover:scale-[1.02] active:scale-95 focus:outline-none"
              prefetch={false}
            >
              <Image src="/logo-institucional.png" alt="Contrato Directo" width={500} height={221} className="h-9 w-auto" />
            </Link>
            <p className="max-w-xs text-sm font-light leading-relaxed text-quartz-lavender">
              Conecta. Acuerda. Realiza. La plataforma que conecta clientes con proveedores de servicios de confianza.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-inkline-violet text-quartz-lavender transition-colors hover:border-pulse-cobalt hover:text-white"
              >
                <LinkedInIcon className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/542233546089"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-inkline-violet text-quartz-lavender transition-colors hover:border-pulse-cobalt hover:text-white"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="galileo-eyebrow mb-4 text-signal-teal">Plataforma</h3>
            <ul className="space-y-3 text-sm font-light text-quartz-lavender">
              <li><Link href="/servicios" className="transition-colors hover:text-white">Buscar Servicios</Link></li>
              <li><Link href="/proveedores" className="transition-colors hover:text-white">Ser Proveedor</Link></li>
              <li><Link href="/ayuda" className="transition-colors hover:text-white">Centro de Ayuda</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="galileo-eyebrow mb-4 text-signal-teal">Legal</h3>
            <ul className="space-y-3 text-sm font-light text-quartz-lavender">
              <li><Link href="/terminos" className="transition-colors hover:text-white">Términos y Condiciones</Link></li>
              <li><Link href="/privacidad" className="transition-colors hover:text-white">Política de Privacidad</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="galileo-eyebrow mb-4 text-signal-teal">Contacto</h3>
            <ul className="space-y-3 text-sm font-light text-quartz-lavender">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-mist-lilac" />
                <span>San Luis 1815, Planta Alta<br />Mar del Plata, Argentina</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-mist-lilac" />
                <a href="mailto:info@contratodirecto.com.ar" className="break-all transition-colors hover:text-white">
                  info@contratodirecto.com.ar
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-mist-lilac" />
                <a href="tel:+542233546089" className="transition-colors hover:text-white">
                  +54 223 354 60 89
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-inkline-violet/60 pt-8 text-center text-xs text-mist-lilac sm:flex-row sm:text-left">
          <p>&copy; {new Date().getFullYear()} Contrato Directo. Todos los derechos reservados.</p>
          <p className="tracking-[0.25em] uppercase">Conecta · Acuerda · Realiza</p>
        </div>
      </div>
    </footer>
  );
}
