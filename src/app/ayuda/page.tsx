'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import BuscadorInteligente from '@/components/ayuda/BuscadorInteligente';
import FeedbackArticulo from '@/components/ayuda/FeedbackArticulo';
import api, { extractData } from '@/lib/api';
import { ChevronDown, ChevronUp, HelpCircle, MessageSquare, Mail, Phone } from 'lucide-react';
import type { Faq } from '@/types';

export default function AyudaPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('');
  const [faqAbierta, setFaqAbierta] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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

  const faqsFiltradas = faqs.filter((f) => {
    const matchBusqueda = !busqueda || f.pregunta.toLowerCase().includes(busqueda.toLowerCase()) || f.respuesta.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = !categoriaActiva || f.categoria === categoriaActiva;
    return matchBusqueda && matchCategoria;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <div className="bg-slate-900/50 border-b border-slate-800 py-12">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <HelpCircle className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-4">Centro de Ayuda</h1>
            <p className="text-slate-400 mb-6">¿Tenés una pregunta? Encontrá la respuesta aquí</p>
            <div className="max-w-lg mx-auto">
              <BuscadorInteligente
                faqs={faqs}
                onSelect={(faq) => {
                  setBusqueda(faq.pregunta);
                  setCategoriaActiva(faq.categoria);
                }}
              />
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            <button
              onClick={() => setCategoriaActiva('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !categoriaActiva
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
              }`}
            >
              Todas
            </button>
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  categoriaActiva === cat
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQs */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
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
                      <FeedbackArticulo idFaq={faq.id_faq} />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Contact */}
          <div className="mt-12">
            <Card>
              <div className="text-center">
                <CardTitle>¿No encontraste tu respuesta?</CardTitle>
                <p className="text-slate-400 mt-2 mb-6">Nuestro equipo de soporte está disponible para ayudarte</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/dashboard/tickets">
                    <Button variant="outline">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Abrir Ticket
                    </Button>
                  </Link>
                  <Button variant="outline">
                    <Mail className="w-4 h-4 mr-2" />
                    soporte@contratodirecto.com
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Fix type - this should be Faq from types
