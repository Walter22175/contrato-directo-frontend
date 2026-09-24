'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { Star, Shield, CheckCircle, Search, Award, Clock, ArrowLeft, Users, FileText, BadgeCheck, Eye } from 'lucide-react';

export default function ProveedoresVerificadosPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-slate-900/50 border-b border-slate-800 py-8">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
              <Link href="/ayuda" className="hover:text-cyan-400 transition-colors">Ayuda</Link>
              <span>/</span>
              <span className="text-white">Proveedores Verificados</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Proveedores Verificados</h1>
                <p className="text-slate-400 mt-1">El sello que garantiza confianza y calidad</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-8">
            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <BadgeCheck className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">¿Qué significa el Sello?</h2>
                    <p className="text-slate-300">El proveedor pasó todas las validaciones: identidad, fiscal (AFIP), documentación y avales.</p>
                  </div>
                </div>
                <p className="text-slate-400">
                  Solo los proveedores con el <span className="font-semibold text-cyan-400">Sello Verificado</span> pueden ofrecer servicios en la plataforma.
                  Es tu garantía de que estás contratando a un profesional real, con documentación en regla y respaldado por otros clientes.
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Las 4 validaciones obligatorias</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">1. Identidad</h3>
                      <p className="text-slate-400 text-sm">DNI validado + selfie con documento. Confirmamos que la persona es quien dice ser.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">2. Fiscal (AFIP)</h3>
                      <p className="text-slate-400 text-sm">CUIT consultado en padrón A10. Estado ACTIVO, constancia de inscripción verificada.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Search className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">3. Documentación</h3>
                      <p className="text-slate-400 text-sm">Comprobante de domicilio, constancia AFIP, certificado de antecedentes (según rubro).</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">4. Avales</h3>
                      <p className="text-slate-400 text-sm">Mínimo 1 aval profesional (cliente anterior, proveedor, colega) que confirme experiencia.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Proceso de verificación (48-72h hábiles)</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold">1</div>
                    <div>
                      <h3 className="font-semibold text-white">Envío de documentos</h3>
                      <p className="text-slate-400 text-sm">El proveedor sube todo en el wizard de 6 pasos. URLs a Drive/Dropbox/OneDrive.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold">2</div>
                    <div>
                      <h3 className="font-semibold text-white">Validación automática AFIP</h3>
                      <p className="text-slate-400 text-sm">Consulta inmediata al padrón A10. Si CUIT ACTIVO + docs completos → auto-aprobación 24h.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold">3</div>
                    <div>
                      <h3 className="font-semibold text-white">Revisión manual (si aplica)</h3>
                      <p className="text-slate-400 text-sm">Equipo admin valida docs, contacta avales. SLA 48h hábiles (72h para conversión cliente→proveedor).</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold">4</div>
                    <div>
                      <h3 className="font-semibold text-white">Sello otorgado</h3>
                      <p className="text-slate-400 text-sm">Badge visible en perfil, búsqueda y tarjetas. Notificación al proveedor. Ya puede recibir trabajos.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Beneficios para vos como cliente</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Seguridad</h3>
                      <p className="text-slate-400 text-sm">Sabés que el proveedor existe legalmente, tiene domicilio real y respaldo profesional.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Calidad</h3>
                      <p className="text-slate-400 text-sm">Solo verificados publican. Filtro "Solo verificados" en búsqueda. Ranking prioriza verificados.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Eye className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Transparencia</h3>
                      <p className="text-slate-400 text-sm">Verificás el estado en su perfil: fecha de verificación, documentos, avales. Sin sorpresas.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-amber-500/10 border-amber-500/20">
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Re-verificación periódica</h3>
                    <p className="text-slate-300 text-sm">
                      Cada 90 días validamos automáticamente el CUIT en AFIP. Si pasa a INACTIVO o vencen docs, 
                      el sello se suspende temporalmente hasta regularizar. Te avisamos si contrataste a alguien afectado.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="text-center">
              <Link href="/ayuda" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300">
                <ArrowLeft className="w-4 h-4" />
                Volver al Centro de Ayuda
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}