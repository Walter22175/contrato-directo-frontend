'use client';

import { useAuthStore } from '@/store/auth';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { User, Mail, Phone, MapPin, Calendar, Edit3, Shield, Star, FileText } from 'lucide-react';

export default function PerfilPage() {
  const { user } = useAuthStore();

  const formatearFecha = (f: string) =>
    new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });

  const rol = user?.usuario_roles?.[0]?.rol?.nombre || 'Sin rol';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
            <Link
              href="/dashboard/configuracion"
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 rounded-lg text-sm transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Editar
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <div className="p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  {user?.nombre} {user?.apellido}
                </h2>
                <p className="text-sm text-slate-400 mt-1">{user?.email}</p>
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">
                    <Shield className="w-3 h-3" />
                    {rol}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="md:col-span-2">
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Información Personal</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-sm text-white">{user?.email || '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Teléfono</p>
                      <p className="text-sm text-white">{user?.telefono || '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <MapPin className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Dirección</p>
                      <p className="text-sm text-white">{user?.direccion || '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Miembro desde</p>
                      <p className="text-sm text-white">
                        {user?.fecha_registro ? formatearFecha(user.fecha_registro) : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {(user?.cuit_cuil || user?.dni) && (
                  <>
                    <h3 className="text-lg font-semibold text-white mt-6 mb-4">Datos Fiscales</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {user?.cuit_cuil && (
                        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                          <FileText className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500">CUIT/CUIL</p>
                            <p className="text-sm text-white">{user.cuit_cuil}</p>
                          </div>
                        </div>
                      )}
                      {user?.dni && (
                        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                          <FileText className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500">DNI</p>
                            <p className="text-sm text-white">{user.dni}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="mt-6 pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`px-2 py-0.5 rounded ${
                      user?.estado === 'activo' ? 'text-green-400 bg-green-500/10' : 'text-slate-400 bg-slate-500/10'
                    }`}>
                      {user?.estado || '—'}
                    </span>
                    <span className="text-slate-500">
                      {user?.email_verificado ? 'Email verificado' : 'Email no verificado'}
                    </span>
                    <span className="text-slate-500 capitalize">
                      {user?.tipo_persona === 'fisica' ? 'Persona Física' : 'Persona Jurídica'}
                    </span>
                  </div>
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
