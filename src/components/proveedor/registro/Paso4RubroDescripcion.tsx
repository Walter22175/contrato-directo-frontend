'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Briefcase, Hash, Link2 } from 'lucide-react';

const paso4Schema = z.object({
  rubro_principal: z.string().min(2, 'El rubro es obligatorio').max(100),
  descripcion: z.string().max(500).optional(),
  redes_sociales: z.record(z.string()).optional(),
});

type Paso4Form = z.infer<typeof paso4Schema>;

const REDES_OPTIONS = [
  { key: 'instagram', label: 'Instagram', placeholder: '@usuario' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'usuario' },
  { key: 'facebook', label: 'Facebook', placeholder: 'usuario' },
  { key: 'twitter', label: 'X/Twitter', placeholder: '@usuario' },
  { key: 'web', label: 'Web', placeholder: 'https://...' },
];

interface Paso4RubroDescripcionProps {
  onNext: (data: Paso4Form) => Promise<void>;
  onBack: () => void;
  initialData?: Partial<Paso4Form>;
  disabled?: boolean;
  rubrosDisponibles?: string[];
}

export default function Paso4RubroDescripcion({
  onNext,
  onBack,
  initialData,
  disabled,
  rubrosDisponibles = [
    'Plomería',
    'Electricidad',
    'Gasista',
    'Pintura',
    'Carpintería',
    'Cerrajería',
    'Albañilería',
    'Jardinería',
    'Limpieza',
    'Mudanzas',
    'Refrigeración',
    'Calefacción',
    'Electrodomésticos',
    'Cerrajería',
    'Vidriería',
    'Herrería',
    'Impermeabilización',
    'Drywall',
    'Pisos y revestimientos',
    'Techos',
    'Otro',
  ],
}: Paso4RubroDescripcionProps) {
  const [customRubro, setCustomRubro] = useState(false);
  const [redes, setRedes] = useState<Record<string, string>>(
    initialData?.redes_sociales || {}
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Paso4Form>({
    resolver: zodResolver(paso4Schema),
    defaultValues: {
      ...initialData,
    },
    mode: 'onBlur',
  });

  const rubro = watch('rubro_principal');

  useEffect(() => {
    if (initialData?.redes_sociales) {
      setRedes(initialData.redes_sociales);
    }
  }, [initialData?.redes_sociales]);

  const handleSubmitForm = async (data: Paso4Form) => {
    await onNext({ ...data, redes_sociales: redes });
  };

  const handleRedesChange = (key: string, value: string) => {
    setRedes(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={disabled || isSubmitting}>
          ← Volver
        </Button>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Rubro principal *
        </label>
        <div className="relative">
          <Select
            label=""
            options={rubrosDisponibles.map(r => ({ value: r, label: r }))}
            placeholder="Seleccioná tu rubro principal"
            error={errors.rubro_principal?.message}
            {...register('rubro_principal')}
            disabled={disabled || isSubmitting}
          />
        </div>
        {rubro === 'Otro' && (
          <Input
            label="Especificar rubro"
            placeholder="Ej: Instalación de paneles solares"
            {...register('rubro_principal')}
            disabled={disabled || isSubmitting}
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Descripción del perfil
        </label>
        <textarea
          {...register('descripcion')}
          className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent min-h-[100px] resize-y"
          placeholder="Describí tu experiencia, especialidades, zona de cobertura, años en el rubro..."
          maxLength={500}
          disabled={disabled || isSubmitting}
        />
        <p className="text-xs text-slate-500 mt-1 text-right">
          {watch('descripcion')?.length || 0}/500
        </p>
        {errors.descripcion && (
          <p className="mt-1 text-sm text-red-400">{errors.descripcion.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Redes sociales / Contacto
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {REDES_OPTIONS.map((red) => (
            <div key={red.key} className="relative">
              <Input
                label={red.label}
                placeholder={red.placeholder}
                value={redes[red.key] || ''}
                onChange={(e) => handleRedesChange(red.key, e.target.value)}
                disabled={disabled || isSubmitting}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onBack} disabled={disabled || isSubmitting}>
          Volver
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={disabled}>
          Continuar
        </Button>
      </div>
    </div>
  );
}