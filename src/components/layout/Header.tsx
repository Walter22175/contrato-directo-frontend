'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useNotificationStore } from '@/store/notifications';
import { useUiStore } from '@/store/ui';
import { useNotificationsSocket } from '@/hooks/useNotificationsSocket';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Search, Bell, User, LogOut, ChevronDown, Check, X, Box } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import api, { extractData } from '@/lib/api';
import { iconoCategoria } from '@/lib/iconos';

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

interface CategoriaApi {
  id_categoria: number;
  nombre: string;
  slug?: string;
}

interface ServicioApi {
  id_servicio: number;
  nombre: string;
  id_categoria: number;
}

type RespuestaLista<T> = T[] & { data?: T[] };

export default function Header({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const { noLeidas, notificaciones, fetchNoLeidas, fetchNotificaciones, marcarLeida, marcarTodasLeidas } = useNotificationStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sidebarAbierta = useUiStore((s) => s.sidebarAbierta);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Array<{type: 'categoria' | 'servicio' | 'recent'; label: string; value: string; slug?: string}>>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [categories, setCategories] = useState<Array<{id_categoria: number; nombre: string; slug: string}>>([]);
  const [services, setServices] = useState<Array<{id_servicio: number; nombre: string; id_categoria: number}>>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    useUiStore.getState().cerrarSidebar();
  }, [pathname]);

  // Fetch categories and services for suggestions
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchData = async () => {
      try {
        const [catRes, servRes] = await Promise.all([
          api.get<RespuestaLista<CategoriaApi>>('/catalogo/categorias', { params: { activa: true } }),
          api.get<RespuestaLista<ServicioApi>>('/servicios', { params: { activo: true } }),
        ]);
        const catsRaw = extractData<RespuestaLista<CategoriaApi>>(catRes);
        const servsRaw = extractData<RespuestaLista<ServicioApi>>(servRes);
        const cats = catsRaw?.data || catsRaw || [];
        const servs = servsRaw?.data || servsRaw || [];
        setCategories(cats.map((c) => ({ id_categoria: c.id_categoria, nombre: c.nombre, slug: c.slug || c.nombre.toLowerCase().replace(/\s+/g, '-') })));
        setServices(servs.map((s) => ({ id_servicio: s.id_servicio, nombre: s.nombre, id_categoria: s.id_categoria })));
      } catch (e) {
        console.error('Error fetching search data:', e);
      }
    };
    fetchData();
  }, [isAuthenticated]);

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

  const generateSuggestions = useCallback(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const sug: Array<{type: 'categoria' | 'servicio' | 'recent'; label: string; value: string; slug?: string}> = [];

    // Recent searches first
    const recentMatches = recentSearches
      .filter(s => s.toLowerCase().includes(query))
      .slice(0, 2)
      .map(s => ({ type: 'recent' as const, label: s, value: s }));

    // Categoría suggestions
    const catMatches = categories
      .filter(c => c.nombre.toLowerCase().includes(query))
      .slice(0, 3)
      .map(c => ({ type: 'categoria' as const, label: c.nombre, value: c.slug, slug: c.slug }));

    // Servicio suggestions
    const servMatches = services
      .filter(s => s.nombre.toLowerCase().includes(query))
      .slice(0, 5)
      .map(s => ({ type: 'servicio' as const, label: s.nombre, value: s.nombre, id_servicio: s.id_servicio }));

    sug.push(...recentMatches, ...catMatches, ...servMatches);
    setSuggestions(sug);
    setSelectedIndex(-1);
  }, [searchQuery, recentSearches, categories, services]);

  useEffect(() => {
    generateSuggestions();
    setShowSearchResults(searchQuery.length > 0);
  }, [generateSuggestions, searchQuery, recentSearches]);

  const handleSuggestionClick = (suggestion: {type: string; value: string; slug?: string; id_servicio?: number}) => {
    if (suggestion.type === 'categoria' && suggestion.slug) {
      router.push(`/servicios?categoria=${suggestion.slug}`);
    } else if (suggestion.type === 'servicio' && suggestion.id_servicio) {
      router.push(`/servicios/${suggestion.id_servicio}`);
    } else {
      router.push(`/servicios?q=${encodeURIComponent(suggestion.value)}`);
    }
    setShowSearchResults(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Always prevent default for navigation keys to avoid form submission
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
    }
    
    if (!showSearchResults || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearchSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
      return;
    }
    
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSuggestionClick(suggestions[selectedIndex]);
      } else {
        handleSearchSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
    } else if (e.key === 'Escape') {
      setShowSearchResults(false);
      searchInputRef.current?.blur();
    }
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const conSidebar =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/servicios') ||
    pathname.startsWith('/proveedores');
  const menuAbierto = mobileMenuOpen || (conSidebar && sidebarAbierta);

  const alternarMenuMovil = () => {
    onToggleSidebar?.();
    if (menuAbierto) {
      setMobileMenuOpen(false);
      useUiStore.getState().cerrarSidebar();
      return;
    }
    if (conSidebar) {
      useUiStore.getState().alternarSidebar();
    } else {
      setMobileMenuOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-28 relative">
          {/* Cyan accent line at bottom of header */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60" />
          
            <Link href="/" className="flex items-center gap-2 transition-transform active:scale-90" prefetch={false}>
              <Image src="/logo-institucional.png" alt="Contrato Directo" width={96} height={96} className="w-24 h-24 transition-transform duration-200" />
            </Link>

          {isAuthenticated && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full" ref={searchRef}>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-cyan-500/10 rounded-xl -m-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                <form onSubmit={handleSearchSubmit} className="group relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar servicios, proveedores..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => searchQuery && setShowSearchResults(true)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 group-hover:border-cyan-300 transition-colors duration-200"
                  />
                </form>
                {showSearchResults && (recentSearches.length > 0 || searchQuery || suggestions.length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto">
                    {recentSearches.length > 0 && (
                      <div className="p-2 border-b border-slate-100">
                        <p className="text-xs text-slate-500 px-3 py-1">Búsquedas recientes</p>
                        <div className="max-h-40 overflow-y-auto">
                          {recentSearches.map((term, i) => (
                            <button
                              key={i}
                              onClick={() => { setSearchQuery(term); doSearch(term); }}
                              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded transition-colors flex items-center gap-2"
                            >
                              <Search className="w-4 h-4 text-slate-400" />
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {suggestions.length > 0 && (
                      <div className="p-2 border-b border-slate-100">
                        <p className="text-xs text-slate-500 px-3 py-1">Sugerencias</p>
                        <div className="max-h-40 overflow-y-auto">
                          {suggestions.map((sug, i) => (
                            <button
                              key={i}
                              onClick={() => handleSuggestionClick(sug)}
                              onMouseEnter={() => setSelectedIndex(i)}
                              className={`w-full px-3 py-2 text-sm text-left hover:bg-slate-50 rounded transition-colors flex items-center gap-2 ${
                                i === selectedIndex ? 'bg-slate-50' : ''
                              }`}
                            >
                              <div className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0 
                                {sug.type === 'categoria' ? 'bg-purple-100 text-purple-600' : 
                                 sug.type === 'servicio' ? 'bg-cyan-100 text-cyan-600' : 
                                 'bg-slate-100 text-slate-500'}
                              ">
                                {sug.type === 'categoria' && (
                                  iconoCategoria(sug.label) ? (
                                    <Image src={iconoCategoria(sug.label)!} alt="" width={32} height={32} unoptimized className="w-8 h-8 object-contain" />
                                  ) : (
                                    <Box className="w-8 h-8" />
                                  )
                                )}
                                {sug.type === 'servicio' && <Search className="w-8 h-8" />}
                                {sug.type === 'recent' && <Search className="w-8 h-8 text-slate-400" />}
                              </div>
                              <span className="text-slate-900 font-medium truncate flex-1">{sug.label}</span>
                              <div className="text-xs text-slate-500">
                                {sug.type === 'categoria' && 'Categoría'}
                                {sug.type === 'servicio' && 'Servicio'}
                                {sug.type === 'recent' && 'Reciente'}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {searchQuery && suggestions.length === 0 && recentSearches.length === 0 && (
                      <div className="p-2">
                        <button
                          onClick={(e) => { e.preventDefault(); doSearch(searchQuery); }}
                          className="w-full text-left px-3 py-2 text-sm text-cyan-600 hover:bg-slate-100 rounded transition-colors flex items-center gap-2"
                        >
                          <Search className="w-4 h-4" />
                          Buscar {'"'}{searchQuery}{'"'}
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
                <Link 
                  href="/servicios" 
                  className={`font-medium transition-colors ${
                    pathname === '/servicios' 
                      ? 'text-cyan-600 active:text-cyan-700' 
                      : 'text-slate-600 hover:text-slate-900 active:text-cyan-600'
                  }`}
                >
                  Servicios
                </Link>
                <Link 
                  href="/proveedores" 
                  className={`font-medium transition-colors ${
                    pathname === '/proveedores' 
                      ? 'text-cyan-600 active:text-cyan-700' 
                      : 'text-slate-600 hover:text-slate-900 active:text-cyan-600'
                  }`}
                >
                  Proveedores
                </Link>
                <Link 
                  href="/dashboard" 
                  className={`font-medium transition-colors ${
                    pathname.startsWith('/dashboard') 
                      ? 'text-cyan-600 active:text-cyan-700' 
                      : 'text-slate-600 hover:text-slate-900 active:text-cyan-600'
                  }`}
                >
                  Dashboard
                </Link>

                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={handleNotifClick}
                    className="relative text-amber-500 hover:text-amber-600 active:text-amber-700 transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {noLeidas > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-xs text-white flex items-center justify-center">
                        {noLeidas > 99 ? '99+' : noLeidas}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <span className="text-sm font-medium text-slate-900">Notificaciones</span>
                        {noLeidas > 0 && (
                          <button
                            onClick={() => marcarTodasLeidas()}
                            className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
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
                              className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                                !notif.leida ? 'bg-slate-50' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                  notif.tipo === 'transaccional' ? 'bg-cyan-500' :
                                  notif.tipo === 'actividad' ? 'bg-yellow-500' : 'bg-slate-400'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm ${!notif.leida ? 'font-medium text-slate-900' : 'text-slate-600'}`}>
                                    {notif.titulo}
                                  </p>
                                  <p className="text-xs text-slate-500 truncate">{notif.mensaje}</p>
                                  <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(notif.fecha_envio)}</p>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                      <Link
                        href="/dashboard/notificaciones"
                        onClick={() => setNotifOpen(false)}
                        className="block px-4 py-3 text-center text-sm text-cyan-600 hover:bg-slate-50 border-t border-slate-100"
                      >
                        Ver todas
                      </Link>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 active:text-cyan-600 transition-colors"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center active:bg-cyan-50">
                      <User className="w-4 h-4 text-slate-600 active:text-cyan-600" />
                    </div>
                    <span className="text-sm text-slate-700">{user?.nombre}</span>
                    <ChevronDown className="w-4 h-4 text-slate-500 active:text-cyan-600" />
                  </button>

                  {userMenuOpen ? (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1">
                      <Link href="/perfil" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                        Mi Perfil
                      </Link>
                      <Link href="/dashboard/configuracion" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                        Configuración
                      </Link>
                      <Link href="/dashboard" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                        Dashboard
                      </Link>
                      <hr className="border-slate-100 my-1" />
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:text-cyan-600 active:bg-cyan-50">Iniciar Sesión</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-700 active:text-white">Registrarse</Button>
                </Link>
              </div>
            )}
          </nav>

          <button
            onClick={alternarMenuMovil}
            className="md:hidden text-slate-600 hover:text-slate-900"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
          >
            {menuAbierto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link href="/servicios" className="block py-2 text-slate-600 hover:text-slate-900 active:text-cyan-600" onClick={() => setMobileMenuOpen(false)}>
                  Servicios
                </Link>
                <Link href="/proveedores" className="block py-2 text-slate-600 hover:text-slate-900 active:text-cyan-600" onClick={() => setMobileMenuOpen(false)}>
                  Proveedores
                </Link>
                <Link href="/dashboard" className="block py-2 text-slate-600 hover:text-slate-900 active:text-cyan-600" onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>
                <hr className="border-slate-100" />
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="block py-2 text-red-600 hover:text-red-700 active:text-red-700"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-cyan-50 active:text-cyan-600 active:border-cyan-200">Iniciar Sesión</Button>
                </Link>
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-700 active:text-white">Registrarse</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
