'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { CheckCircle, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

const paso2Schema = z.object({
  dni: z.string().optional(),
  cuit_cuil: z.string().optional(),
  categoria_iva: z.enum(['responsable_inscripto', 'monotributo', 'no_categorizado']).optional(),
  tipo_comercio: z.enum(['servicio', 'producto', 'mixto']).optional(),
}).refine((data) => data.dni || data.cuit_cuil, {
  message: 'Debe proporcionar al menos DNI o CUIT/CUIL',
  path: ['dni'],
});

type Paso2Form = z.infer<typeof paso2Schema>;

interface AfipValidationResult {
  valido: boolean;
  cuit: string;
  existe_en_padron: boolean;
  estado_afip: string;
  contribuyente?: {
    denominacion: string;
    tipo_persona: string;
    domicilio_fiscal: {
      direccion: string;
      localidad: string;
      provincia: string;
      codigo_postal: string;
    };
    actividades: Array<{ codigo: string; descripcion: string }>;
  };
  observaciones: string[];
}

interface Paso2DatosFiscalesProps {
  onNext: (data: Paso2Form) => Promise<void>;
  onBack: () => void;
  initialData?: Partial<Paso2Form>;
  disabled?: boolean;
  onValidarCuit?: (cuit: string) => Promise<AfipValidationResult | null>;
}

export default function Paso2DatosFiscales({
  onNext,
  onBack,
  initialData,
  disabled,
  onValidarCuit,
}: Paso2DatosFiscalesProps) {
  const [validating, setValidating] = useState(false);
  const [cuitValidation, setCuitValidation] = useState<AfipValidationResult | null>(null);
  const [cuitChecking, setCuitChecking] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Paso2Form>({
    resolver: zodResolver(paso2Schema),
    defaultValues: {
      ...initialData,
    },
    mode: 'onBlur',
  });

  const cuit = watch('cuit_cuil');
  const dni = watch('dni');

  useEffect(() => {
    if (!cuit || cuit.replace(/[-\s]/g, '').length !== 11) {
      setCuitValidation(null);
      return;
    }
    const timer = setTimeout(async () => {
      setCuitChecking(true);
      if (onValidarCuit) {
        const result = await onValidarCuit(cuit.replace(/[-\s]/g, ''));
        setCuitValidation(result);
      }
      setCuitChecking(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [cuit, onValidarCuit]);

  const handleSubmitForm = async (data: Paso2Form) => {
    setValidating(true);
    try {
      await onNext(data);
    } finally {
      setValidating(false);
    }
  };

  const formatCuit = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 10) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 10)}-${numbers.slice(10)}`;
  };

  const handleCuitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('cuit_cuil', formatCuit(e.target.value), { shouldValidate: true });
  };

  const formatDni = (value: string) => value.replace(/\D/g, '').slice(0, 8);
  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('dni', formatDni(e.target.value), { shouldValidate: true });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={disabled || isSubmitting || validating}>
          ← Volver
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="DNI"
          placeholder="12345678"
          value={dni}
          onChange={handleDniChange}
          error={errors.dni?.message}
          disabled={disabled || isSubmitting || validating}
          maxLength={8}
        />
        <div className="relative">
          <Input
            label="CUIT/CUIL"
            placeholder="20-12345678-9"
            value={cuit}
            onChange={handleCuitChange}
            error={errors.cuit_cuil?.message}
            disabled={disabled || isSubmitting || validating}
            maxLength={13}
          />
          {cuitChecking && (
            <div className="absolute right-3 top-9 text-slate-400">
              <Loader2 className="animate-spin w-5 h-5" />
            </div>
          )}
          {cuitValidation && !cuitChecking && cuitValidation.valido && (
            <div className="absolute right-3 top-9 text-green-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          )}
          {cuitValidation && !cuitChecking && !cuitValidation.valido && (
            <div className="absolute right-3 top-9 text-red-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>

      {cuitValidation && (
        <div className={`p-3 rounded-lg border ${
          cuitValidation.valido
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            {cuitValidation.valido ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="font-medium">
              {cuitValidation.valido ? 'CUIT válido en AFIP' : 'CUIT inválido o no encontrado'}
            </span>
          </div>
          {cuitValidation.contribuyente && (
            <div className="text-sm space-y-1 ml-6">
              <p><strong>Razón Social:</strong> {cuitValidation.contribuyente.denominacion}</p>
              <p><strong>Tipo:</strong> {cuitValidation.contribuyente.tipo_persona}</p>
              <p>
                <strong>Domicilio:</strong>{' '}
                {cuitValidation.contribuyente.domicilio_fiscal.direccion},{' '}
                {cuitValidation.contribuyente.domicilio_fiscal.localidad},{' '}
                {cuitValidation.contribuyente.domicilio_fiscal.provincia}{' '}
                ({cuitValidation.contribuyente.domicilio_fiscal.codigo_postal})
              </p>
              {cuitValidation.contribuyente.actividades.length > 0 && (
                <p>
                  <strong>Actividad principal:</strong>{' '}
                  {cuitValidation.contribuyente.actividades[0].descripcion}
                </p>
              )}
            </div>
          )}
          {cuitValidation.observaciones.map((obs, i) => (
            <p key={i} className="text-xs mt-1">{obs}</p>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Categoría IVA"
          options={[
            { value: 'responsable_inscripto', label: 'Responsable Inscripto' },
            { value: 'monotributo', label: 'Monotributo' },
            { value: 'no_categorizado', label: 'No Categorizado' },
          ]}
          placeholder="Seleccioná una opción"
          error={errors.categoria_iva?.message}
          {...register('categoria_iva')}
          disabled={disabled || isSubmitting || validating}
        />
        <Select
          label="Tipo de Comercio"
          options={[
            { value: 'servicio', label: 'Solo Servicios' },
            { value: 'producto', label: 'Solo Productos' },
            { value: 'mixto', label: 'Servicios y Productos' },
          ]}
          placeholder="Seleccioná una opción"
          error={errors.tipo_comercio?.message}
          {...register('tipo_comercio')}
          disabled={disabled || isSubmitting || validating}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onBack} disabled={disabled || isSubmitting || validating}>
          Volver
        </Button>
        <Button type="submit" isLoading={isSubmitting || validating} disabled={disabled}>
          Continuar
        </Button>
      </div>
    </div>
  );
}