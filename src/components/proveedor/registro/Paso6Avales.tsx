'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { UserPlus, Trash2 } from 'lucide-react';

const avalSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio').max(100),
  contacto: z.string().min(1, 'Contacto obligatorio').max(100),
  observaciones: z.string().max(200).optional(),
});

const paso6Schema = z.object({
  avales: z.array(avalSchema).min(1, 'Debe agregar al menos un aval'),
  acepta_terminos: z.boolean().refine(v => v === true, { message: 'Debe aceptar los términos y condiciones' }),
});

type Paso6Form = z.infer<typeof paso6Schema>;
type AvalForm = z.infer<typeof avalSchema>;

interface Paso6AvalesProps {
  onComplete: (data: Paso6Form) => Promise<void>;
  onBack: () => void;
  initialData?: Partial<Paso6Form>;
  disabled?: boolean;
}

export default function Paso6Avales({
  onComplete,
  onBack,
  initialData,
  disabled,
}: Paso6AvalesProps) {
  const [avales, setAvales] = useState<AvalForm[]>(
    initialData?.avales || [{ nombre: '', contacto: '', observaciones: '' }]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Paso6Form>({
    resolver: zodResolver(paso6Schema),
    defaultValues: {
      avales,
      acepta_terminos: false,
    },
    mode: 'onBlur',
  });

  const aceptaTerminos = watch('acepta_terminos');

  const handleSubmitForm = async (data: Paso6Form) => {
    await onComplete(data);
  };

  const updateAval = (index: number, field: keyof AvalForm, value: string) => {
    const newAvales = [...avales];
    newAvales[index] = { ...newAvales[index], [field]: value };
    setAvales(newAvales);
    setValue('avales', newAvales, { shouldValidate: true });
  };

  const addAval = () => {
    const newAvales = [...avales, { nombre: '', contacto: '', observaciones: '' }];
    setAvales(newAvales);
    setValue('avales', newAvales, { shouldValidate: true });
  };

  const removeAval = (index: number) => {
    if (avales.length > 1) {
      const newAvales = avales.filter((_, i) => i !== index);
      setAvales(newAvales);
      setValue('avales', newAvales, { shouldValidate: true });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-5">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" type="button" onClick={onBack} disabled={disabled || isSubmitting}>
          ← Volver
        </Button>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
          <UserPlus className="w-4 h-4" />
          <span>Agregá al menos un aval profesional (cliente anterior, proveedor, colega)</span>
        </div>
        <p className="text-xs text-slate-500">El aval será contactado para validar tu experiencia y confiabilidad.</p>
      </div>

      <div className="space-y-4">
        {avales.map((_, index) => (
          <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-white">Aval #{index + 1}</h4>
              {avales.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAval(index)}
                  disabled={disabled || isSubmitting}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Nombre *"
                placeholder="Juan Pérez"
                error={errors.avales?.[index]?.nombre?.message}
                value={avales[index]?.nombre || ''}
                onChange={(e) => updateAval(index, 'nombre', e.target.value)}
                disabled={disabled || isSubmitting}
              />
              <Input
                label="Contacto (email o teléfono) *"
                placeholder="juan@email.com o +54 11 1234-5678"
                error={errors.avales?.[index]?.contacto?.message}
                value={avales[index]?.contacto || ''}
                onChange={(e) => updateAval(index, 'contacto', e.target.value)}
                disabled={disabled || isSubmitting}
              />
            </div>

            <Input
              label="Observaciones"
              placeholder="Relación profesional, años de conocimiento, etc."
              value={avales[index]?.observaciones || ''}
              onChange={(e) => updateAval(index, 'observaciones', e.target.value)}
              disabled={disabled || isSubmitting}
              maxLength={200}
            />
            <p className="text-xs text-slate-500 text-right">
              {avales[index]?.observaciones?.length || 0}/200
            </p>
          </div>
        ))}

        {errors.avales && (
          <p className="text-sm text-red-400">{errors.avales.message}</p>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addAval}
        disabled={disabled || isSubmitting}
        className="w-full"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Agregar otro aval
      </Button>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            {...register('acepta_terminos')}
            className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
            disabled={disabled || isSubmitting}
          />
          <div className="text-sm text-slate-300">
            <label className="flex items-start gap-2 cursor-pointer">
              <span>
                Acepto los <a href="/terminos" target="_blank" rel="noopener" className="text-cyan-400 hover:underline">Términos y Condiciones</a> y la <a href="/privacidad" target="_blank" rel="noopener" className="text-cyan-400 hover:underline">Política de Privacidad</a> de Contrato Directo.
              </span>
            </label>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            {...register('acepta_terminos')}
            className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
            disabled={disabled || isSubmitting}
          />
          <div className="text-sm text-slate-300">
            <label className="flex items-start gap-2 cursor-pointer">
              <span>
                Autorizo la verificación de mis datos fiscales con AFIP y la consulta de mi CUIT en el padrón público.
              </span>
            </label>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            {...register('acepta_terminos')}
            className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
            disabled={disabled || isSubmitting}
          />
          <div className="text-sm text-slate-300">
            <label className="flex items-start gap-2 cursor-pointer">
              <span>
                Declaro que la información proporcionada es veraz y completa. Entiendo que datos falsos pueden derivar en la cancelación de mi cuenta.
              </span>
            </label>
          </div>
        </div>
        {errors.acepta_terminos && (
          <p className="text-sm text-red-400 ml-6">{errors.acepta_terminos.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onBack} disabled={disabled || isSubmitting}>
          Volver
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={disabled || !aceptaTerminos}
        >
          {aceptaTerminos ? 'Completar Registro' : 'Aceptá los términos para continuar'}
        </Button>
      </div>
    </form>
  );
}