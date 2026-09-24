'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useNotificationStore } from '@/store/notifications';
import { useNotificationsSocket } from '@/hooks/useNotificationsSocket';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Search, Bell, User, LogOut, ChevronDown, Check, X, ChevronRight, Box } from 'lucide-react';
import Button from '@/components/ui/Button';
import api, { extractData } from '@/lib/api';

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

interface SearchSuggestion {
  type: 'categoria' | 'servicio' | 'recent';
  label: string;
  value: string;
  slug?: string;
}

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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Array<{type: 'categoria' | 'servicio' | 'recent'; label: string; value: string; slug?: string}>>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [categories, setCategories] = useState<Array<{id_categoria: number; nombre: string; slug: string}>>([]);
  const [services, setServices] = useState<Array<{id_servicio: number; nombre: string; id_categoria: number}>>([]);
  const [loadingSearchData, setLoadingSearchData] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

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

  // Fetch categories and services for suggestions
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchData = async () => {
      setLoadingSearchData(true);
      try {
        const [catRes, servRes] = await Promise.all([
          api.get('/catalogo/categorias', { params: { activa: true } }),
          api.get('/servicios', { params: { activo: true } }),
        ]);
        const catsRaw = extractData<any>(catRes);
        const servsRaw = extractData<any>(servRes);
        const cats = catsRaw?.data || catsRaw || [];
        const servs = servsRaw?.data || servsRaw || [];
        setCategories(cats.map((c: any) => ({ id_categoria: c.id_categoria, nombre: c.nombre, slug: c.slug || c.nombre.toLowerCase().replace(/\s+/g, '-') })));
        setServices(servs.map((s: any) => ({ id_servicio: s.id_servicio, nombre: s.nombre, id_categoria: s.id_categoria })));
      } catch (e) {
        console.error('Error fetching search data:', e);
      } finally {
        setLoadingSearchData(false);
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
    setShowSuggestions(false);
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
      .map(s => ({ type: 'servicio' as const, label: s.nombre, value: s.nombre }));

    sug.push(...recentMatches, ...catMatches, ...servMatches);
    setSuggestions(sug);
    setSelectedIndex(-1);
  }, [searchQuery, recentSearches, categories, services]);

  useEffect(() => {
    generateSuggestions();
    setShowSearchResults(searchQuery.length > 0 || recentSearches.length > 0 || suggestions.length > 0);
  }, [generateSuggestions, searchQuery, recentSearches]);

  const handleSuggestionClick = (suggestion: {type: string; value: string; slug?: string}) => {
    if (suggestion.type === 'categoria' && suggestion.slug) {
      router.push(`/servicios?categoria=${suggestion.slug}`);
    } else {
      router.push(`/servicios?q=${encodeURIComponent(suggestion.value)}`);
    }
    setShowSearchResults(false);
    setShowSuggestions(false);
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
      setShowSuggestions(false);
      searchInputRef.current?.blur();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
        setShowSuggestions(false);
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

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-institucional.png" alt="Contrato Directo" className="w-24 h-24" />
            <span className="text-xl font-bold text-white hidden sm:block">Contrato Directo</span>
          </Link>

          {isAuthenticated && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <form onSubmit={handleSearchSubmit}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar servicios, proveedores..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => searchQuery && setShowSearchResults(true)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </form>
                {showSearchResults && (recentSearches.length > 0 || searchQuery || suggestions.length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto">
                    {recentSearches.length > 0 && (
                      <div className="p-2 border-b border-slate-700">
                        <p className="text-xs text-slate-500 px-3 py-1">Búsquedas recientes</p>
                        <div className="max-h-40 overflow-y-auto">
                          {recentSearches.map((term, i) => (
                            <button
                              key={i}
                              onClick={() => { setSearchQuery(term); doSearch(term); }}
                              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded transition-colors flex items-center gap-2"
                            >
                              <Search className="w-4 h-4 text-slate-500" />
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {suggestions.length > 0 && (
                      <div className="p-2 border-b border-slate-700">
                        <p className="text-xs text-slate-500 px-3 py-1">Sugerencias</p>
                        <div className="max-h-40 overflow-y-auto">
                          {suggestions.map((sug, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                if (sug.type === 'categoria' && sug.slug) {
                                  router.push(`/servicios?categoria=${sug.slug}`);
                                } else {
                                  router.push(`/servicios?q=${encodeURIComponent(sug.value)}`);
                                }
                                setShowSearchResults(false);
                              }}
                              onMouseEnter={() => setSelectedIndex(i)}
                              className={`w-full px-3 py-2 text-sm text-left hover:bg-slate-700 rounded transition-colors flex items-center gap-2 ${
                                i === selectedIndex ? 'bg-slate-700' : ''
                              }`}
                            >
                              <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 
                                {sug.type === 'categoria' ? 'bg-purple-500/20 text-purple-400' : 
                                 sug.type === 'servicio' ? 'bg-cyan-500/20 text-cyan-400' : 
                                 'bg-slate-500/20 text-slate-400'}
                              ">
                                {sug.type === 'categoria' && <Box className="w-4 h-4" />}
                                {sug.type === 'servicio' && <Search className="w-4 h-4" />}
                                {sug.type === 'recent' && <Search className="w-4 h-4 text-slate-500" />}
                              </div>
                              <span className="text-white font-medium truncate flex-1">{sug.label}</span>
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
