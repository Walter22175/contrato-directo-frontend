'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import Paso1DatosPersonales from '@/components/proveedor/registro/Paso1DatosPersonales';
import Paso2DatosFiscales from '@/components/proveedor/registro/Paso2DatosFiscales';
import Paso3Contacto from '@/components/proveedor/registro/Paso3Contacto';
import Paso4RubroDescripcion from '@/components/proveedor/registro/Paso4RubroDescripcion';
import Paso5DocumentacionFiscal from '@/components/proveedor/registro/Paso5DocumentacionFiscal';
import Paso6Avales from '@/components/proveedor/registro/Paso6Avales';
import { Check, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import SUSModal from '@/components/ui/SUSModal';

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

export default function ConvertirProveedorPage() {
  const router = useRouter();
  const { user, isAuthenticated, loadUser } = useAuthStore();

  const [pasoActual, setPasoActual] = useState<PasoActual>(1);
  const [wizardData, setWizardData] = useState<WizardState>({});
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showSUS, setShowSUS] = useState(false);
  const [prefilledData, setPrefilledData] = useState<any>(null);
  const [clientData, setClientData] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (user?.id_usuario) {
      fetchClientData();
    }
  }, [isAuthenticated, router, user?.id_usuario]);

  const fetchClientData = async () => {
    if (!user?.id_usuario) return;
    try {
      const res = await api.get(`/usuarios/${user.id_usuario}`);
      const data = res.data?.data || res.data;
      setClientData(data);
      buildPrefilledData(data);
    } catch (err) {
      console.error('Error fetching client data:', err);
    }
  };

  const buildPrefilledData = (data: any) => {
    const prefilled = {
      paso1: {
        nombre: data.nombre || '',
        apellido: data.apellido || '',
        email: data.email || '',
        password: '',
        confirmPassword: '',
        tipo_persona: data.tipo_persona === 'FISICA' ? 'fisica' : 'juridica',
      },
      paso2: {
        dni: data.dni || '',
        cuit_cuil: data.cuit_cuil || '',
        categoria_iva: '',
        tipo_comercio: '',
      },
      paso3: {
        direccion: data.direccion || '',
        telefono: data.telefono || '',
        sitio_web: '',
      },
      paso4: {
        rubro_principal: '',
        descripcion: '',
        redes_sociales: {},
      },
      paso5: {
        documentacion_fiscal_url: '',
        observaciones: '',
      },
      paso6: {
        avales: [{ nombre: '', contacto: '', observaciones: '' }],
        acepta_terminos: false,
      },
    };
    setPrefilledData(prefilled);
    setWizardData(prefilled);
  };

  const handleNext = useCallback(async (paso: PasoActual, data: any) => {
    setSaving(true);
    try {
      setWizardData(prev => ({ ...prev, [paso === 1 ? 'paso1' : paso === 2 ? 'paso2' : paso === 3 ? 'paso3' : paso === 4 ? 'paso4' : paso === 5 ? 'paso5' : 'paso6']: data }));
      if (paso < 6) setPasoActual((paso + 1) as PasoActual);
    } catch (err) {
      console.error('Error guardando paso:', err);
    } finally {
      setSaving(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    setPasoActual(prev => Math.max(1, prev - 1) as PasoActual);
  }, []);

  const handleComplete = useCallback(async (data: any) => {
    if (!user?.id_usuario) return;
    setCompleting(true);
    try {
      setWizardData(prev => ({ ...prev, paso6: data }));
      const dto = {
        rubro_principal: wizardData.paso4?.rubro_principal || '',
        cuit_cuil: wizardData.paso2?.cuit_cuil || '',
        descripcion: wizardData.paso4?.descripcion || '',
        documentacion_fiscal_url: wizardData.paso5?.documentacion_fiscal_url || '',
        avales: data.avales || {},
        dni: wizardData.paso2?.dni,
        telefono: wizardData.paso3?.telefono,
        direccion: wizardData.paso3?.direccion,
      };
      await api.post('/usuarios/convertir-proveedor', dto);
      setShowSUS(true);
    } catch (err) {
      console.error('Error completando conversión:', err);
    } finally {
      setCompleting(false);
    }
  }, [user?.id_usuario, wizardData.paso4?.rubro_principal, wizardData.paso2?.cuit_cuil]);

  const handleSUSSubmit = async (score: number, responses: any) => {
    try {
      await api.post('/metricas/sus/registro', {
        ...responses,
        sus_score: score,
        flujo: 'registro_proveedor',
        id_usuario: user?.id_usuario,
      });
    } catch (e) {
      console.error('Error enviando SUS:', e);
    }
    await loadUser();
    router.push('/proveedores/verificacion');
  };

  const progress = (pasoActual / 6) * 100;

  const isProveedor = user?.usuario_roles?.some((ur: any) => ur.rol?.nombre === 'proveedor' && ur.activo);

  if (isProveedor) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <Header />
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white">Ya eres Proveedor</h1>
              <p className="text-slate-400 mt-2">Tu cuenta ya tiene el rol de proveedor activo.</p>
              <Button onClick={() => router.push('/proveedores/verificacion')} className="mt-6" size="lg">
                Ver estado de verificación
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => router.push('/perfil')}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-white">Convertirme en Proveedor</h1>
                  <p className="text-slate-400 mt-1">Completa los datos adicionales para ofrecer tus servicios</p>
                </div>
              </div>
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
                onValidarCuit={async (cuit: string) => {
                  try {
                    const res = await api.get(`/afip-validation/cuit/${cuit}`);
                    return res.data?.data || res.data;
                  } catch {
                    return null;
                  }
                }}
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