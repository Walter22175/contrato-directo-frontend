'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, Mail, Phone, MapPin } from 'lucide-react';

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0z" />
    </svg>
  );
}

export default function Footer() {

  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 transition-transform duration-200 hover:scale-105 active:scale-90 hover:cursor-pointer focus:outline-none focus:ring-0 rounded-full p-1" prefetch={false}>
              <Image src="/logo-institucional.png" alt="Contrato Directo" width={32} height={32} className="w-8 h-8 transition-transform duration-200" />
            </Link>
            <p className="text-slate-400 text-sm">
              Conecta. Acuerda. Realiza. La plataforma que conecta clientes con proveedores de servicios de confianza.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <LinkedInIcon className="w-5 h-5" />
              </a>
              <a
                href="https://wa.me/542233546089"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Plataforma</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/servicios" className="hover:text-white transition-colors">Buscar Servicios</Link></li>
              <li><Link href="/proveedores" className="hover:text-white transition-colors">Ser Proveedor</Link></li>
              <li><Link href="/ayuda" className="hover:text-white transition-colors">Centro de Ayuda</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/terminos" className="hover:text-white transition-colors">Términos y Condiciones</Link></li>
              <li><Link href="/privacidad" className="hover:text-white transition-colors">Política de Privacidad</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Contacto</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>San Luis 1815, Planta Alta<br />Mar del Plata, Argentina</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <a href="mailto:comercial@contactodirecto.com.ar" className="hover:text-white transition-colors break-all">
                  comercial@contactodirecto.com.ar
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                <a href="tel:+542233546089" className="hover:text-white transition-colors">
                  +54 223 354 60 89
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Contrato Directo. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
