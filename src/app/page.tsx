'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Shield, FileText, Star, ArrowRight, ChevronRight, Box } from 'lucide-react';
import Button from '@/components/ui/Button';

const categories = [
  { name: 'Mantenimiento', icon: '🔧', slug: 'mantenimiento' },
  { name: 'Automóviles', icon: '🚗', slug: 'automoviles' },
  { name: 'Mascotas', icon: '🐾', slug: 'mascotas' },
  { name: 'Tecnología', icon: '💻', slug: 'tecnologia' },
  { name: 'Community Manager', icon: '📱', slug: 'community-manager' },
  { name: 'Software', icon: '⚙️', slug: 'software' },
  { name: 'Paisajismo', icon: '🌿', slug: 'paisajismo' },
];

const features = [
  {
    icon: Shield,
    title: 'Pagos Seguros',
    description: 'Tu dinero está protegido hasta que el servicio sea completado y conformado.',
    href: '/ayuda/pagos-seguros',
  },
  {
    icon: FileText,
    title: 'Contratos Digitales',
    description: 'Contratos con validez legal que protegen a ambas partes.',
    href: '/ayuda/contratos-digitales',
  },
  {
    icon: Star,
    title: 'Proveedores Verificados',
    description: 'Todos nuestros proveedores pasan por un riguroso proceso de verificación.',
    href: '/ayuda/proveedores-verificados',
  },
];

interface SearchSuggestion {
  type: 'categoria' | 'servicio';
  label: string;
  value: string;
  slug?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [heroSearch, setHeroSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const generateSuggestions = useCallback(() => {
    if (!heroSearch.trim()) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    const query = heroSearch.toLowerCase();
    const sug: SearchSuggestion[] = [];

    // Categoría suggestions from local categories
    const catMatches = categories
      .filter((c) => c.name.toLowerCase().includes(query))
      .slice(0, 5)
      .map((c) => ({
        type: 'categoria' as const,
        label: c.name,
        value: c.slug,
        slug: c.slug,
      }));

    // Could also add common service searches
    const serviceKeywords = ['plomería', 'electricidad', 'gasista', 'pintura', 'carpintería', 'cerrajería', 'jardinería', 'limpieza', 'mudanzas', 'refrigeración'];
    const servMatches = serviceKeywords
      .filter((s) => s.includes(query))
      .slice(0, 5)
      .map((s) => ({
        type: 'servicio' as const,
        label: s,
        value: s,
      }));

    sug.push(...catMatches, ...servMatches);
    setSuggestions(sug);
    setSelectedIndex(-1);
  }, [heroSearch]);

  useEffect(() => {
    generateSuggestions();
    setShowSuggestions(heroSearch.length > 0);
  }, [generateSuggestions]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHeroSearch(value);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'categoria' && suggestion.slug) {
      router.push(`/servicios?categoria=${suggestion.slug}`);
    } else {
      router.push(`/servicios?q=${encodeURIComponent(suggestion.value)}`);
    }
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSuggestionClick(suggestions[selectedIndex]);
      } else {
        handleHeroSearch(e as unknown as React.FormEvent);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      searchInputRef.current?.blur();
    }
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = heroSearch.trim();
    if (query) router.push(`/servicios?q=${encodeURIComponent(query)}`);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node) &&
          suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900 to-cyan-900/20" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Conecta. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Acuerda.</span> Realiza.
              </h1>
              <p className="text-xl text-slate-300 mb-8">
                La plataforma que conecta clientes con proveedores de servicios de confianza. Contratos seguros, pagos protegidos.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleHeroSearch} className="relative">
                <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                  <div className="relative flex-1" ref={searchInputRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="¿Qué servicio necesitás? (ej: plomería, electricidad...)"
                      value={heroSearch}
                      onChange={handleSearchChange}
                      onFocus={() => heroSearch && setShowSuggestions(true)}
                      onKeyDown={handleKeyDown}
                      className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    
                    {showSuggestions && suggestions.length > 0 && (
                      <div ref={suggestionsRef} className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
                        {suggestions.map((sug, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestionClick(sug)}
                            onMouseEnter={() => setSelectedIndex(i)}
                            className={`w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors flex items-center gap-3 border-b border-slate-700/50 last:border-0 ${
                              i === selectedIndex ? 'bg-slate-700' : ''
                            }`}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 
                              {sug.type === 'categoria' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'}
                            ">
                              {sug.type === 'categoria' ? (
                                <Box className="w-4 h-4" />
                              ) : (
                                <Search className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-white font-medium truncate block">{sug.label}</span>
                              {sug.type === 'categoria' && (
                                <span className="text-xs text-slate-500">Categoría</span>
                              )}
                              {sug.type === 'servicio' && (
                                <span className="text-xs text-slate-500">Buscar servicio</span>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          </button>
                        ))}
                        {suggestions.length === 0 && heroSearch && (
                          <div className="px-4 py-3 text-center text-slate-500">
                            No se encontraron sugerencias para "{heroSearch}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button type="submit" size="lg" className="whitespace-nowrap">
                    Buscar
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
                
                {showSuggestions && suggestions.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500 text-center">
                    Usá ↑↓ para navegar, Enter para seleccionar
                  </p>
                )}
              </form>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-white text-center mb-8">Categorías Populares</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/servicios?categoria=${cat.slug}`}
                  className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-cyan-500/50 transition-colors"
                >
                  <span className="text-3xl">{cat.icon}</span>
                  <span className="text-sm text-slate-300 text-center">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-white text-center mb-12">¿Por qué Contrato Directo?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feat) => {
                const Icon = feat.icon;
                return (
                  <Link key={feat.title} href={feat.href} className="group">
                    <div className="text-center p-6 hover:shadow-lg hover:shadow-cyan-500/10 rounded-xl transition-all duration-300 bg-slate-800/30 border border-slate-700/50 hover:border-cyan-500/30">
                      <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                        <Icon className="w-7 h-7 text-cyan-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">{feat.title}</h3>
                      <p className="text-slate-400">{feat.description}</p>
                      <div className="mt-4 flex items-center justify-center gap-1 text-cyan-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                        <span>Ver más</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-r from-blue-900/30 to-cyan-900/30">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">¿Sos proveedor de servicios?</h2>
            <p className="text-slate-300 mb-8">
              Unite a miles de profesionales que ya confían en Contrato Directo para conseguir nuevos clientes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/proveedores/convertir">
                <Button size="lg">Quiero Ser Proveedor</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="outline" size="lg">Registrarse como Cliente</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
