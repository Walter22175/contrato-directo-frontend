'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useNotificationStore } from '@/store/notifications';
import { useUiStore } from '@/store/ui';
import { useNotificationsSocket } from '@/hooks/useNotificationsSocket';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Search, Bell, User, LogOut, ChevronDown, Check, X, Box, Lightbulb, Briefcase, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import api, { extractData } from '@/lib/api';
import { iconoCategoria } from '@/lib/iconos';
import { cn } from '@/lib/utils';

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

export function esVentanaLanzamiento(fecha: Date = new Date()): boolean {
  return fecha.getDate() >= 1 && fecha.getDate() <= 5;
}

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
  const proveedorEstado = useAuthStore((s) => s.proveedorEstado);
  const cambiarContexto = useAuthStore((s) => s.cambiarContexto);
  const loadUser = useAuthStore((s) => s.loadUser);
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
  const [mostrarBannerLanzamiento, setMostrarBannerLanzamiento] = useState(false);
  const blacklight = useUiStore((s) => s.blacklight);
  const [gestoLampara, setGestoLampara] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [contextoActivo, setContextoActivo] = useState<string | null>(null);
  const [cambiandoContexto, setCambiandoContexto] = useState(false);

  const alternarBlacklight = () => {
    useUiStore.getState().alternarBlacklight();
    setGestoLampara(false);
    requestAnimationFrame(() => setGestoLampara(true));
  };

  useNotificationsSocket((event) => {
    useNotificationStore.getState().addNotificacion({
      id_notificacion:
        event.id_notificacion != null
          ? String(event.id_notificacion)
          : crypto.randomUUID(),
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
    setMostrarBannerLanzamiento(esVentanaLanzamiento());
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const update = () => {
      document.documentElement.style.setProperty(
        '--header-height',
        `${el.offsetHeight}px`,
      );
    };

    update();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }

    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    setContextoActivo(localStorage.getItem('contexto_activo'));
  }, [user, pathname]);

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
    setNotifOpen(false);
    if (notif.id_ticket) {
      router.push(`/dashboard/tickets/${notif.id_ticket}`);
    } else {
      router.push('/dashboard/tickets');
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

  const handleCambiarContexto = async () => {
    const destino = contextoActivo === 'proveedor' ? 'cliente' : 'proveedor';
    setCambiandoContexto(true);
    try {
      await cambiarContexto(destino);
      await loadUser();
      setContextoActivo(destino);
      setUserMenuOpen(false);
      setMobileMenuOpen(false);
      router.push('/dashboard');
      router.refresh();
    } catch {
      // El store expone el error para la UI que lo consuma.
    } finally {
      setCambiandoContexto(false);
    }
  };

  return (
    <header ref={headerRef} className="sticky top-0 z-50 border-b border-inkline-violet/60 bg-void-navy/85 backdrop-blur-xl">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-28 items-center justify-between">
          {/* Línea de señal de marca */}
          <div className="galileo-gradient absolute bottom-0 left-0 right-0 h-px opacity-70" />
          
            <Link href="/" className="flex items-center gap-2 rounded-full bg-white px-3 py-2 transition-transform active:scale-95">
              <Image src="/logo-institucional.png" alt="Contrato Directo" width={500} height={221} className="h-9 w-auto sm:h-11 transition-transform duration-200" />
            </Link>

          {isAuthenticated && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full" ref={searchRef}>
                <Search className="absolute left-4 top-1/2 z-10 w-4 h-4 -translate-y-1/2 text-mist-lilac transition-colors group-hover:text-pulse-cobalt" />
                <form onSubmit={handleSearchSubmit} className="group relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar servicios, proveedores..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => searchQuery && setShowSearchResults(true)}
                    className="w-full rounded-full border border-inkline-violet bg-deep-indigo/80 py-2.5 pl-11 pr-4 text-sm font-light text-pure-white placeholder:text-mist-lilac transition-colors duration-200 focus:border-pulse-cobalt focus:outline-none focus:ring-2 focus:ring-pulse-cobalt/40 group-hover:border-dusk-iris"
                  />
                </form>
                {showSearchResults && (recentSearches.length > 0 || searchQuery || suggestions.length > 0) && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-[28px] border border-inkline-violet bg-deep-indigo shadow-2xl shadow-black/50">
                    {recentSearches.length > 0 && (
                      <div className="border-b border-inkline-violet/60 p-2">
                        <p className="px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-mist-lilac">Búsquedas recientes</p>
                        <div className="max-h-40 overflow-y-auto">
                          {recentSearches.map((term, i) => (
                            <button
                              key={i}
                              onClick={() => { setSearchQuery(term); doSearch(term); }}
                              className="flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-sm font-light text-quartz-lavender transition-colors hover:bg-white/5 hover:text-white"
                            >
                              <Search className="w-4 h-4 text-mist-lilac" />
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {suggestions.length > 0 && (
                      <div className="border-b border-inkline-violet/60 p-2">
                        <p className="px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-mist-lilac">Sugerencias</p>
                        <div className="max-h-40 overflow-y-auto">
                          {suggestions.map((sug, i) => (
                            <button
                              key={i}
                              onClick={() => handleSuggestionClick(sug)}
                              onMouseEnter={() => setSelectedIndex(i)}
                              className={`flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-sm font-light transition-colors hover:bg-white/5 ${
                                i === selectedIndex ? 'bg-white/5' : ''
                              }`}
                            >
                              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-inkline-violet/60 bg-void-navy/60">
                                {sug.type === 'categoria' && (
                                  iconoCategoria(sug.label) ? (
                                    <Image src={iconoCategoria(sug.label)!} alt="" width={32} height={32} unoptimized className="w-8 h-8 object-contain" />
                                  ) : (
                                    <Box className="w-8 h-8 text-mist-lilac" />
                                  )
                                )}
                                {sug.type === 'servicio' && <Search className="w-6 h-6 text-pulse-cobalt" />}
                                {sug.type === 'recent' && <Search className="w-6 h-6 text-mist-lilac" />}
                              </div>
                              <span className="flex-1 truncate font-normal text-pure-white">{sug.label}</span>
                              <div className="text-xs text-mist-lilac">
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
                          className="flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-sm font-light text-cyan-300 transition-colors hover:bg-white/5 hover:text-white"
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
                  className={`rounded-full border px-4 py-2 text-sm font-light transition-colors ${
                    pathname === '/servicios'
                      ? 'border-white/80 text-white'
                      : 'border-transparent text-quartz-lavender hover:border-inkline-violet hover:text-white'
                  }`}
                >
                  Servicios
                </Link>
                <Link
                  href="/proveedores"
                  className={`rounded-full border px-4 py-2 text-sm font-light transition-colors ${
                    pathname === '/proveedores'
                      ? 'border-white/80 text-white'
                      : 'border-transparent text-quartz-lavender hover:border-inkline-violet hover:text-white'
                  }`}
                >
                  Proveedores
                </Link>
                <Link
                  href="/dashboard"
                  className={`rounded-full border px-4 py-2 text-sm font-light transition-colors ${
                    pathname.startsWith('/dashboard')
                      ? 'border-white/80 text-white'
                      : 'border-transparent text-quartz-lavender hover:border-inkline-violet hover:text-white'
                  }`}
                >
                  Dashboard
                </Link>

                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={handleNotifClick}
                    className="relative text-quartz-lavender transition-colors hover:text-white"
                  >
                    <Bell className="w-5 h-5" />
                    {noLeidas > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-pulse-cobalt text-[10px] text-white">
                        {noLeidas > 99 ? '99+' : noLeidas}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-[28px] border border-inkline-violet bg-deep-indigo shadow-2xl shadow-black/50">
                      <div className="flex items-center justify-between border-b border-inkline-violet/60 px-4 py-3">
                        <span className="text-sm font-normal text-pure-white">Notificaciones</span>
                        {noLeidas > 0 && (
                          <button
                            onClick={() => marcarTodasLeidas()}
                            className="flex items-center gap-1 text-xs text-cyan-300 hover:text-white"
                          >
                            <Check className="w-3 h-3" />
                            Marcar todas leídas
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notificaciones.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-mist-lilac">
                            No hay notificaciones
                          </div>
                        ) : (
                          notificaciones.slice(0, 10).map((notif) => (
                            <button
                              key={notif.id_notificacion}
                              onClick={() => handleNotifItemClick(notif)}
                              className={`w-full border-b border-inkline-violet/40 px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                                !notif.leida ? 'bg-white/[0.03]' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`mt-2 h-2 w-2 flex-shrink-0 rounded-full ${
                                  notif.tipo === 'transaccional' ? 'bg-pulse-cobalt' :
                                  notif.tipo === 'actividad' ? 'bg-yellow-500' : 'bg-mist-lilac'
                                }`} />
                                <div className="min-w-0 flex-1">
                                  <p className={`text-sm ${!notif.leida ? 'font-normal text-pure-white' : 'text-quartz-lavender'}`}>
                                    {notif.titulo}
                                  </p>
                                  <p className="truncate text-xs text-mist-lilac">{notif.mensaje}</p>
                                  <p className="mt-1 text-xs text-slate-600">{formatRelativeTime(notif.fecha_envio)}</p>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                      <Link
                        href="/dashboard/notificaciones"
                        onClick={() => setNotifOpen(false)}
                        className="block border-t border-inkline-violet/60 px-4 py-3 text-center text-sm text-cyan-300 hover:bg-white/5"
                      >
                        Ver todas
                      </Link>
                    </div>
                  )}
                </div>

                {proveedorEstado === 'aprobado' && (
                  <button
                    onClick={handleCambiarContexto}
                    disabled={cambiandoContexto}
                    className="flex items-center gap-2 rounded-full border border-inkline-violet px-3 py-2 text-sm font-light text-quartz-lavender transition-colors hover:border-pulse-cobalt hover:text-white disabled:opacity-60"
                    title={
                      contextoActivo === 'proveedor'
                        ? 'Cambiar al modo cliente'
                        : 'Ir al dashboard como proveedor'
                    }
                  >
                    {cambiandoContexto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Briefcase className="h-4 w-4" />
                    )}
                    {contextoActivo === 'proveedor' ? 'Cliente' : 'Proveedor'}
                  </button>
                )}

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-quartz-lavender transition-colors hover:text-white"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-inkline-violet bg-white/5">
                      <User className="w-4 h-4 text-quartz-lavender" />
                    </div>
                    <span className="text-sm font-light text-pure-white">{user?.nombre}</span>
                    <ChevronDown className="w-4 h-4 text-mist-lilac" />
                  </button>

                  {userMenuOpen ? (
                    <div className="absolute right-0 mt-3 w-48 overflow-hidden rounded-[24px] border border-inkline-violet bg-deep-indigo py-1 shadow-2xl shadow-black/50">
                      <Link href="/perfil" className="block px-4 py-2 text-sm font-light text-quartz-lavender hover:bg-white/5 hover:text-white" onClick={() => setUserMenuOpen(false)}>
                        Mi Perfil
                      </Link>
                      <Link href="/dashboard/configuracion" className="block px-4 py-2 text-sm font-light text-quartz-lavender hover:bg-white/5 hover:text-white" onClick={() => setUserMenuOpen(false)}>
                        Configuración
                      </Link>
                      <Link href="/dashboard" className="block px-4 py-2 text-sm font-light text-quartz-lavender hover:bg-white/5 hover:text-white" onClick={() => setUserMenuOpen(false)}>
                        Dashboard
                      </Link>
                      <hr className="my-1 border-inkline-violet/60" />
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-light text-red-400 hover:bg-white/5"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">Iniciar Sesión</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Registrarse</Button>
                </Link>
              </div>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={alternarBlacklight}
              onMouseEnter={() => setGestoLampara(false)}
              className={cn(
                'p-2 rounded-full transition-colors',
                blacklight
                  ? 'text-amber-400 hover:text-amber-300 bg-amber-400/10'
                  : 'text-quartz-lavender hover:text-white hover:bg-white/5',
              )}
              aria-label={blacklight ? 'Desactivar modo blacklight' : 'Activar modo blacklight'}
              aria-pressed={blacklight}
              title="Modo blacklight"
            >
              <Lightbulb
                className={cn(
                  'w-5 h-5 transition-all duration-300',
                  gestoLampara && 'animate-lamp-gesture',
                  blacklight && 'drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]',
                )}
              />
            </button>

            <button
              onClick={alternarMenuMovil}
              className="text-quartz-lavender hover:text-white md:hidden"
              aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuAbierto}
            >
              {menuAbierto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isAuthenticated && mostrarBannerLanzamiento && (
          <div className="pb-3">
            <Link
              href="/novedades/anticipo-30"
              className="galileo-gradient flex flex-wrap items-center justify-center gap-2 rounded-full px-4 py-2 text-center text-sm font-light text-white transition-opacity hover:opacity-90"
            >
              <span>Anticipo del 30% para servicios largos.</span>
              <span className="rounded-full border border-white/60 px-3 py-0.5 text-xs">Más información</span>
            </Link>
          </div>
        )}

        {mobileMenuOpen && (
          <div className="border-t border-inkline-violet/60 py-4 md:hidden">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link href="/servicios" className="block rounded-full px-4 py-2 text-quartz-lavender hover:bg-white/5 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                  Servicios
                </Link>
                <Link href="/proveedores" className="block rounded-full px-4 py-2 text-quartz-lavender hover:bg-white/5 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                  Proveedores
                </Link>
                <Link href="/dashboard" className="block rounded-full px-4 py-2 text-quartz-lavender hover:bg-white/5 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>
                {proveedorEstado === 'aprobado' && (
                  <button
                    onClick={handleCambiarContexto}
                    disabled={cambiandoContexto}
                    className="flex w-full items-center gap-2 rounded-full px-4 py-2 text-left text-quartz-lavender hover:bg-white/5 hover:text-white disabled:opacity-60"
                  >
                    {cambiandoContexto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Briefcase className="h-4 w-4" />
                    )}
                    {contextoActivo === 'proveedor'
                      ? 'Cambiar a Cliente'
                      : 'Ir al dashboard como Proveedor'}
                  </button>
                )}
                <hr className="border-inkline-violet/60" />
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="block rounded-full px-4 py-2 text-red-400 hover:bg-white/5 hover:text-red-300"
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
                  <Button size="sm" className="w-full">Registrarse</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
