'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useNotificationStore } from '@/store/notifications';
import { useNotificationsSocket } from '@/hooks/useNotificationsSocket';
import { useState, useEffect, useRef } from 'react';
import { Menu, Search, Bell, User, LogOut, ChevronDown, Check, X } from 'lucide-react';
import Button from '@/components/ui/Button';

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin}min`;
  if (diffH < 24) return `Hace ${diffH}h`;
  return `Hace ${diffD}d`;
}

const RECENT_SEARCHES_KEY = 'recent_searches';

export default function Header({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const { noLeidas, notificaciones, fetchNoLeidas, fetchNotificaciones, marcarLeida, marcarTodasLeidas } = useNotificationStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useNotificationsSocket((event) => {
    useNotificationStore.getState().addNotificacion({
      id_notificacion: crypto.randomUUID(),
      id_usuario: event.id_usuario,
      tipo: event.tipo,
      evento: event.evento,
      titulo: event.titulo,
      mensaje: event.mensaje,
      canal: 'plataforma',
      leida: false,
      fecha_envio: event.fecha,
    });
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchNoLeidas();
      const interval = setInterval(fetchNoLeidas, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchNoLeidas]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  }, []);

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    const normalized = query.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== normalized.toLowerCase());
      const updated = [normalized, ...filtered].slice(0, 5);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const doSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    setShowSearchResults(false);
    router.push(`/servicios?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    doSearch(searchQuery);
  };

  const handleSearchResultClick = (result: string) => {
    setSearchQuery(result);
    doSearch(result);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotifClick = async () => {
    if (!notifOpen) {
      await fetchNotificaciones();
    }
    setNotifOpen(!notifOpen);
  };

  const handleNotifItemClick = async (notif: typeof notificaciones[0]) => {
    if (!notif.leida) {
      await marcarLeida(notif.id_notificacion);
    }
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim() || recentSearches.length > 0) {
      setShowSearchResults(true);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSearchResults(true);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CD</span>
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">Contrato Directo</span>
          </Link>

          {isAuthenticated && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <form onSubmit={handleSearchSubmit}>
                  <input
                    type="text"
                    placeholder="Buscar servicios, proveedores..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </form>
                {showSearchResults && (recentSearches.length > 0 || searchQuery) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden z-50">
                    {recentSearches.length > 0 && (
                      <div className="p-2 border-b border-slate-700">
                        <p className="text-xs text-slate-500 px-3 py-1">Búsquedas recientes</p>
                        <div className="max-h-40 overflow-y-auto">
                          {recentSearches.map((term, i) => (
                            <button
                              key={i}
                              onClick={() => handleSearchResultClick(term)}
                              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded transition-colors flex items-center gap-2"
                            >
                              <Search className="w-4 h-4 text-slate-500" />
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {searchQuery && (
                      <div className="p-2">
                        <button
                          onClick={(e) => { e.preventDefault(); doSearch(searchQuery); }}
                          className="w-full text-left px-3 py-2 text-sm text-cyan-400 hover:bg-slate-700 rounded transition-colors flex items-center gap-2"
                        >
                          <Search className="w-4 h-4" />
                          Buscar "{searchQuery}"
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

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

                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={handleNotifClick}
                    className="relative text-slate-300 hover:text-white transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {noLeidas > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full text-xs text-white flex items-center justify-center">
                        {noLeidas > 99 ? '99+' : noLeidas}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                        <span className="text-sm font-medium text-white">Notificaciones</span>
                        {noLeidas > 0 && (
                          <button
                            onClick={() => marcarTodasLeidas()}
                            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Marcar todas leídas
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notificaciones.length === 0 ? (
                          <div className="px-4 py-8 text-center text-slate-500 text-sm">
                            No hay notificaciones
                          </div>
                        ) : (
                          notificaciones.slice(0, 10).map((notif) => (
                            <button
                              key={notif.id_notificacion}
                              onClick={() => handleNotifItemClick(notif)}
                              className={`w-full text-left px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors ${
                                !notif.leida ? 'bg-slate-700/30' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                  notif.tipo === 'transaccional' ? 'bg-cyan-400' :
                                  notif.tipo === 'actividad' ? 'bg-yellow-400' : 'bg-slate-500'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm ${!notif.leida ? 'font-medium text-white' : 'text-slate-300'}`}>
                                    {notif.titulo}
                                  </p>
                                  <p className="text-xs text-slate-500 truncate">{notif.mensaje}</p>
                                  <p className="text-xs text-slate-600 mt-1">{formatRelativeTime(notif.fecha_envio)}</p>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                      <Link
                        href="/dashboard/notificaciones"
                        onClick={() => setNotifOpen(false)}
                        className="block px-4 py-3 text-center text-sm text-cyan-400 hover:bg-slate-700/50 border-t border-slate-700"
                      >
                        Ver todas
                      </Link>
                    </div>
                  )}
                </div>

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
                      <Link href="/perfil" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700" onClick={() => setUserMenuOpen(false)}>
                        Mi Perfil
                      </Link>
                      <Link href="/dashboard/configuracion" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700" onClick={() => setUserMenuOpen(false)}>
                        Configuración
                      </Link>
                      <Link href="/dashboard" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700" onClick={() => setUserMenuOpen(false)}>
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

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onToggleSidebar?.();
            }}
            className="md:hidden text-slate-300 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

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
