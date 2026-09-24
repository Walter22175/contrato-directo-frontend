'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth';
import { useRegistroProveedorDraft } from '@/hooks/useRegistroProveedorDraft';
import Paso1DatosPersonales from '@/components/proveedor/registro/Paso1DatosPersonales';
import Paso2DatosFiscales from '@/components/proveedor/registro/Paso2DatosFiscales';
import Paso3Contacto from '@/components/proveedor/registro/Paso3Contacto';
import Paso4RubroDescripcion from '@/components/proveedor/registro/Paso4RubroDescripcion';
import Paso5DocumentacionFiscal from '@/components/proveedor/registro/Paso5DocumentacionFiscal';
import Paso6Avales from '@/components/proveedor/registro/Paso6Avales';
import { Check, ChevronRight, Loader2 } from 'lucide-react';
import SUSModal from '@/components/ui/SUSModal';
import api from '@/lib/api';

const STEPS = [
  { key: 1, label: 'Datos Personales', icon: 'user' },
  { key: 2, label: 'Datos Fiscales', icon: 'file-text' },
  { key: 3, label: 'Contacto', icon: 'map-pin' },
  { key: 4, label: 'Rubro', icon: 'briefcase' },
  { key: 5, label: 'Documentación', icon: 'file-check' },
  { key: 6, label: 'Avales', icon: 'users' },
];

type PasoActual = 1 | 2 | 3 | 4 | 5 | 6;

interface WizardState {
  paso1?: any;
  paso2?: any;
  paso3?: any;
  paso4?: any;
  paso5?: any;
  paso6?: any;
}

export default function RegistroProveedorPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { draft, loading: draftLoading, iniciarRegistro, getProgreso, guardarPaso, validarCuitAfip, completarRegistro, cancelarRegistro, error, clearError } = useRegistroProveedorDraft();

  const [pasoActual, setPasoActual] = useState<PasoActual>(1);
  const [wizardData, setWizardData] = useState<WizardState>({});
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showSUS, setShowSUS] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const initDraft = async () => {
      if (draft) {
        setPasoActual(draft.paso_actual as PasoActual);
        setWizardData({
          paso1: draft.datos_paso_1,
          paso2: draft.datos_paso_2,
          paso3: draft.datos_paso_3,
          paso4: draft.datos_paso_4,
          paso5: draft.datos_paso_5,
          paso6: draft.datos_paso_6,
        });
      } else {
        await iniciarRegistro();
      }
    };
    initDraft();
  }, [draft, iniciarRegistro]);

  const handleNext = useCallback(async (paso: PasoActual, data: any) => {
    setSaving(true);
    try {
      setWizardData(prev => ({ ...prev, [paso === 1 ? 'paso1' : paso === 2 ? 'paso2' : paso === 3 ? 'paso3' : paso === 4 ? 'paso4' : paso === 5 ? 'paso5' : 'paso6']: data }));
      await guardarPaso(paso, data);
      if (paso < 6) setPasoActual((paso + 1) as PasoActual);
    } catch (err) {
      console.error('Error guardando paso:', err);
    } finally {
      setSaving(false);
    }
  }, [guardarPaso]);

  const handleBack = useCallback(() => {
    setPasoActual(prev => Math.max(1, prev - 1) as PasoActual);
  }, []);

  const handleComplete = useCallback(async (data: any) => {
    setCompleting(true);
    try {
      setWizardData(prev => ({ ...prev, paso6: data }));
      await completarRegistro(data);
      setShowSUS(true);
    } catch (err) {
      console.error('Error completando registro:', err);
    } finally {
      setCompleting(false);
    }
  }, [completarRegistro]);

  const handleCancel = useCallback(async () => {
    if (!confirm('¿Cancelar registro? Se perderá el progreso.')) return;
    await cancelarRegistro();
    router.push('/proveedores');
  }, [cancelarRegistro, router]);

  const handleSUSSubmit = async (score: number, responses: any) => {
    try {
      await api.post('/metricas/sus', {
        ...responses,
        sus_score: score,
        flujo: 'registro_proveedor',
        id_usuario: user?.id_usuario,
      });
    } catch (e) {
      console.error('Error enviando SUS:', e);
    }
    router.push('/proveedores/verificacion');
  };

  const progress = (pasoActual / 6) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white">Registro como Proveedor</h1>
                <p className="text-slate-400 mt-1">Completá los 6 pasos para crear tu perfil profesional</p>
              </div>
              {draft && !draft.completado && (
                <Button variant="ghost" size="sm" onClick={() => setShowCancel(true)}>
                  Cancelar
                </Button>
              )}
            </div>

            <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              {STEPS.map((step, i) => (
                <div key={step.key} className="text-center w-full">
                  <span className={`font-medium ${
                    i + 1 < pasoActual ? 'text-cyan-400' :
                    i + 1 === pasoActual ? 'text-white' : 'text-slate-500'
                  }`}>
                    Paso {step.key}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {STEPS.map((step, i) => (
                  <div key={step.key} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      i + 1 < pasoActual
                        ? 'bg-green-500 text-white'
                        : i + 1 === pasoActual
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}>
                      {i + 1 < pasoActual ? <Check className="w-4 h-4" /> : step.key}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`w-16 h-0.5 mx-2 ${
                        i + 1 < pasoActual ? 'bg-green-500' : 'bg-slate-800'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {pasoActual === 1 && (
              <Paso1DatosPersonales
                onNext={(data) => handleNext(1, data)}
                initialData={wizardData.paso1}
                disabled={saving}
              />
            )}

            {pasoActual === 2 && (
              <Paso2DatosFiscales
                onNext={(data) => handleNext(2, data)}
                onBack={handleBack}
                initialData={wizardData.paso2}
                disabled={saving}
                onValidarCuit={validarCuitAfip}
              />
            )}

            {pasoActual === 3 && (
              <Paso3Contacto
                onNext={(data) => handleNext(3, data)}
                onBack={handleBack}
                initialData={wizardData.paso3}
                disabled={saving}
              />
            )}

            {pasoActual === 4 && (
              <Paso4RubroDescripcion
                onNext={(data) => handleNext(4, data)}
                onBack={handleBack}
                initialData={wizardData.paso4}
                disabled={saving}
              />
            )}

            {pasoActual === 5 && (
              <Paso5DocumentacionFiscal
                onNext={(data) => handleNext(5, data)}
                onBack={handleBack}
                initialData={wizardData.paso5}
                disabled={saving}
              />
            )}

            {pasoActual === 6 && (
              <Paso6Avales
                onComplete={(data) => handleComplete(data)}
                onBack={handleBack}
                initialData={wizardData.paso6}
                disabled={saving}
              />
            )}
          </div>
        </div>
      </main>

      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">Cancelar registro</h3>
            <p className="text-slate-400 mb-6">Se perderá todo el progreso. ¿Estás seguro?</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowCancel(false)}>Continuar editando</Button>
              <Button variant="danger" onClick={handleCancel} isLoading={saving}>Cancelar registro</Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 max-w-sm animate-slide-in">
          <div className="flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-300">×</button>
          </div>
        </div>
      )}

      <SUSModal
        open={showSUS}
        onClose={() => {
          setShowSUS(false);
          router.push('/proveedores/verificacion');
        }}
        onSubmit={handleSUSSubmit}
        context="proveedor"
      />
    </div>
  );
}