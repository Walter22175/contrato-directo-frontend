'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { Search, Shield, FileText, Star, ArrowRight } from 'lucide-react';
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
  },
  {
    icon: FileText,
    title: 'Contratos Digitales',
    description: 'Contratos con validez legal que protegen a ambas partes.',
  },
  {
    icon: Star,
    title: 'Proveedores Verificados',
    description: 'Todos nuestros proveedores pasan por un riguroso proceso de verificación.',
  },
];

export default function HomePage() {
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
              <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="¿Qué servicio necesitás?"
                    className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <Button size="lg" className="whitespace-nowrap">
                  Buscar
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
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
                  <div key={feat.title} className="text-center p-6">
                    <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-7 h-7 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feat.title}</h3>
                    <p className="text-slate-400">{feat.description}</p>
                  </div>
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
              <Link href="/auth/register">
                <Button size="lg">Registrarse Gratis</Button>
              </Link>
              <Link href="/ayuda">
                <Button variant="outline" size="lg">Más Información</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
