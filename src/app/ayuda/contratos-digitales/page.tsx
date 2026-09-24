'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { FileText, CheckCircle, Shield, PenTool, Clock, ArrowLeft, FileCheck, Users, Search } from 'lucide-react';

export default function ContratosDigitalesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-slate-900/50 border-b border-slate-800 py-8">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
              <Link href="/ayuda" className="hover:text-cyan-400 transition-colors">Ayuda</Link>
              <span>/</span>
              <span className="text-white">Contratos Digitales</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Contratos Digitales</h1>
                <p className="text-slate-400 mt-1">Validez legal, firma electrónica y protección para ambas partes</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-8">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Validez legal en Argentina</h2>
                <p className="text-slate-300 mb-6">
                  Los contratos generados en Contrato Directo tienen plena validez legal según la <strong>Ley 25.506 de Firma Digital</strong> 
                  y el <strong>Código Civil y Comercial de la Nación (Art. 284-288)</strong>. La firma electrónica certificada equivale a 
                  firma manuscrita para todos los efectos legales.
                </p>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Firma certificada</h3>
                      <p className="text-slate-400 text-sm">Proveedores homologados (DocuSign, Adobe Sign, AFIP) garantizan integridad y no repudio.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileCheck className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Documento inalterable</h3>
                      <p className="text-slate-400 text-sm">Hash criptográfico y sello de tiempo. Cualquier modificación posterior es detectable.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Aceptación expresa</h3>
                      <p className="text-slate-400 text-sm">Ambas partes deben hacer click en "Acepto" tras leer el contrato completo.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Flujo de firma</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold">1</div>
                    <div>
                      <h3 className="font-semibold text-white">Generación automática</h3>
                      <p className="text-slate-400 text-sm">Al contratar, se genera el contrato con datos de ambas partes, servicio, precio, plazos y condiciones.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold">2</div>
                    <div>
                      <h3 className="font-semibold text-white">Revisión de ambas partes</h3>
                      <p className="text-slate-400 text-sm">Cliente y proveedor visualizan el PDF completo antes de firmar. Sin sorpresas.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold">3</div>
                    <div>
                      <h3 className="font-semibold text-white">Firma digital</h3>
                      <p className="text-slate-400 text-sm">Cada parte firma con un click (autenticación 2FA). Se genera certificado de firma individual.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold">4</div>
                    <div>
                      <h3 className="font-semibold text-white">PDF firmado y archivado</h3>
                      <p className="text-slate-400 text-sm">Descargable en cualquier momento. Copia en tu dashboard y en email. Validez probatoria completa.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Qué incluye cada contrato</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-slate-300">Identificación completa (nombre, DNI/CUIT, domicilio)</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-slate-300">Descripción detallada del servicio</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-slate-300">Precio acordado + comisión (8%) + IVA discriminado</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-slate-300">Plazos de ejecución y hitos (si aplica)</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-slate-300">Condiciones de conformidad y reembolso</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-slate-300">Cláusula de mediación obligatoria previa</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-slate-300">Jurisdicción y domicilio legal constituido</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-slate-300">Versiones y historial de cambios trazable</span>
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
                    <h3 className="font-semibold text-white mb-1">Aceptación rápida opcional</h3>
                    <p className="text-slate-300 text-sm">
                      Para servicios menores a $50.000, podés usar "Aceptación Rápida" (check + click) sin firma certificada completa. 
                      Igual validez legal, proceso en segundos. Disponible en el dashboard del cliente.
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