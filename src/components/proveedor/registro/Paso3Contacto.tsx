'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { MapPin, Phone, Globe } from 'lucide-react';

const paso3Schema = z.object({
  direccion: z.string().min(5, 'Dirección muy corta').max(255),
  telefono: z.string().min(8, 'Teléfono inválido').max(20),
  sitio_web: z.string().url('URL inválida').optional().or(z.literal('')),
});

type Paso3Form = z.infer<typeof paso3Schema>;

interface Paso3ContactoProps {
  onNext: (data: Paso3Form) => Promise<void>;
  onBack: () => void;
  initialData?: Partial<Paso3Form>;
  disabled?: boolean;
}

export default function Paso3Contacto({ onNext, onBack, initialData, disabled }: Paso3ContactoProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Paso3Form>({
    resolver: zodResolver(paso3Schema),
    defaultValues: {
      ...initialData,
    },
    mode: 'onBlur',
  });

  const handleSubmitForm = async (data: Paso3Form) => {
    await onNext(data);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={disabled || isSubmitting}>
          ← Volver
        </Button>
      </div>

      <Input
        label="Dirección completa *"
        placeholder="Av. Corrientes 1234, CABA"
        error={errors.direccion?.message}
        {...register('direccion')}
        disabled={disabled || isSubmitting}
        maxLength={255}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="relative">
          <Input
            label="Teléfono *"
            placeholder="+54 11 1234-5678"
            error={errors.telefono?.message}
            {...register('telefono')}
            disabled={disabled || isSubmitting}
            maxLength={20}
          />
        </div>
        <div className="relative">
          <Input
            label="Sitio web"
            placeholder="https://miservicios.com"
            error={errors.sitio_web?.message}
            {...register('sitio_web')}
            disabled={disabled || isSubmitting}
            maxLength={255}
          />
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