'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { useState } from 'react';
import { Menu, X, Search, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CD</span>
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">Contrato Directo</span>
          </Link>

          {/* Search - Desktop */}
          {isAuthenticated && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar servicios, proveedores..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          )}

          {/* Nav - Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link href="/servicios" className="text-slate-300 hover:text-white transition-colors">
                  Servicios
                </Link>
                <Link href="/proveedores" className="text-slate-300 hover:text-white transition-colors">
                  Proveedores
                </Link>
                <Link href="/dashboard" className="text-slate-300 hover:text-white transition-colors">
                  Dashboard
                </Link>

                {/* Notifications */}
                <button className="relative text-slate-300 hover:text-white transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full text-xs text-white flex items-center justify-center">
                    3
                  </span>
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                  >
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-sm">{user?.nombre}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1">
                      <Link href="/perfil" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
                        Mi Perfil
                      </Link>
                      <Link href="/dashboard/configuracion" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
                        Configuración
                      </Link>
                      <Link href="/dashboard" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
                        Dashboard
                      </Link>
                      <hr className="border-slate-700 my-1" />
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Iniciar Sesión</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Registrarse</Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link href="/servicios" className="block py-2 text-slate-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                  Servicios
                </Link>
                <Link href="/proveedores" className="block py-2 text-slate-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                  Proveedores
                </Link>
                <Link href="/dashboard" className="block py-2 text-slate-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>
                <hr className="border-slate-700" />
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="block py-2 text-red-400 hover:text-red-300"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Iniciar Sesión</Button>
                </Link>
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Registrarse</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
