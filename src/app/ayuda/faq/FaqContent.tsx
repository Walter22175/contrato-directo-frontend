'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import api, { extractData } from '@/lib/api';
import { Search, ChevronDown, ChevronUp, HelpCircle, BookOpen } from 'lucide-react';
import Link from 'next/link';
import type { Faq } from '@/types';

export default function FaqContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('');
  const [faqAbierta, setFaqAbierta] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cat = searchParams.get('categoria');
    if (cat) setCategoriaActiva(cat);
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [faqsRes, catsRes] = await Promise.all([
          api.get('/centro-ayuda'),
          api.get('/centro-ayuda/categorias'),
        ]);
        const faqsRaw = extractData<any>(faqsRes);
        const catsRaw = extractData<any>(catsRes);
        setFaqs(faqsRaw?.data || faqsRaw || []);
        const catsData = catsRaw?.data || catsRaw || [];
        setCategorias(
          Array.isArray(catsData)
            ? catsData.map((c: any) => typeof c === 'string' ? c : c.categoria || c.nombre || '')
            : []
        );
      } catch {
        setFaqs([]);
        setCategorias([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCategoriaChange = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat) params.set('categoria', cat);
    else params.delete('categoria');
    router.push(`/ayuda/faq?${params.toString()}`, { scroll: false });
    setCategoriaActiva(cat);
  };

  const faqsFiltradas = faqs.filter((f) => {
    const matchBusqueda = !busqueda || f.pregunta.toLowerCase().includes(busqueda.toLowerCase()) || f.respuesta.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = !categoriaActiva || f.categoria === categoriaActiva;
    return matchBusqueda && matchCategoria;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-slate-900/50 border-b border-slate-800 py-8">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
              <Link href="/ayuda" className="hover:text-cyan-400 transition-colors">Ayuda</Link>
              <span>/</span>
              <span className="text-white">Preguntas Frecuentes</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Preguntas Frecuentes</h1>
            <p className="text-slate-400 mb-6">Encontrá respuestas a las consultas más comunes</p>
            <div className="relative max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar preguntas..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            <Link
              href="/ayuda/faq"
              onClick={(e) => {
                e.preventDefault();
                handleCategoriaChange('');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !categoriaActiva
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
              }`}
            >
              Todas
            </Link>
            {categorias.map((cat) => (
              <Link
                key={cat}
                href={`/ayuda/faq?categoria=${encodeURIComponent(cat)}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleCategoriaChange(cat);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  categoriaActiva === cat
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
              }`}
              >
                {cat}
              </Link>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : faqsFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No se encontraron preguntas</h2>
              <p className="text-slate-400">Intentá con otros términos o contactá soporte</p>
            </div>
          ) : (
            <div className="space-y-3">
              {faqsFiltradas.map((faq) => (
                <Card key={faq.id_faq}>
                  <button
                    onClick={() => setFaqAbierta(faqAbierta === faq.id_faq ? null : faq.id_faq)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-slate-700/50 text-slate-400 px-2 py-1 rounded">
                        {faq.categoria}
                      </span>
                      <h3 className="font-medium text-white">{faq.pregunta}</h3>
                    </div>
                    {faqAbierta === faq.id_faq ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  {faqAbierta === faq.id_faq && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <p className="text-slate-300">{faq.respuesta}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          <div className="mt-12 flex flex-wrap gap-4 justify-center">
            <Link
              href="/ayuda/tutoriales"
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white hover:border-cyan-500/50 transition-colors"
            >
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Ver Tutoriales
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}