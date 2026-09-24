'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const paso1Schema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  apellido: z.string().optional(),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe tener mayúscula, minúscula y número'),
  confirmPassword: z.string(),
  tipo_persona: z.enum(['fisica', 'juridica'], { required_error: 'Seleccioná un tipo' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type Paso1Form = z.infer<typeof paso1Schema>;

interface Paso1DatosPersonalesProps {
  onNext: (data: Paso1Form) => Promise<void>;
  initialData?: Partial<Paso1Form>;
  disabled?: boolean;
}

export default function Paso1DatosPersonales({ onNext, initialData, disabled }: Paso1DatosPersonalesProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [validating, setValidating] = useState(false);
  const [emailCheck, setEmailCheck] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Paso1Form>({
    resolver: zodResolver(paso1Schema),
    defaultValues: {
      tipo_persona: 'fisica',
      ...initialData,
    },
    mode: 'onBlur',
  });

  const email = watch('email');
  const password = watch('password');

  useEffect(() => {
    if (!email || !email.includes('@')) {
      setEmailCheck('idle');
      return;
    }
    const timer = setTimeout(() => {
      setEmailCheck('checking');
    }, 500);
    return () => clearTimeout(timer);
  }, [email]);

  const handleSubmitForm = async (data: Paso1Form) => {
    setValidating(true);
    try {
      await onNext(data);
    } finally {
      setValidating(false);
    }
  };

  const passwordRequirements = [
    { test: (p: string) => p.length >= 8, label: 'Mínimo 8 caracteres' },
    { test: (p: string) => /[a-z]/.test(p), label: 'Una minúscula' },
    { test: (p: string) => /[A-Z]/.test(p), label: 'Una mayúscula' },
    { test: (p: string) => /\d/.test(p), label: 'Un número' },
  ];

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-5" autoComplete="off">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nombre *"
          placeholder="Tu nombre"
          error={errors.nombre?.message}
          {...register('nombre')}
          disabled={disabled || isSubmitting || validating}
        />
        <Input
          label="Apellido"
          placeholder="Tu apellido"
          error={errors.apellido?.message}
          {...register('apellido')}
          disabled={disabled || isSubmitting || validating}
        />
      </div>

      <div className="relative">
        <Input
          label="Email *"
          type="email"
          placeholder="tu@email.com"
          error={errors.email?.message}
          {...register('email')}
          disabled={disabled || isSubmitting || validating}
        />
        {emailCheck === 'checking' && (
          <div className="absolute right-3 top-9 text-slate-400">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
        {emailCheck === 'available' && (
          <div className="absolute right-3 top-9 text-green-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        )}
        {emailCheck === 'taken' && (
          <div className="absolute right-3 top-9 text-red-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="relative">
        <Input
          label="Contraseña *"
          type={showPassword ? 'text' : 'password'}
          placeholder="Mínimo 8 caracteres"
          error={errors.password?.message}
          {...register('password')}
          disabled={disabled || isSubmitting || validating}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-9 text-slate-400 hover:text-white disabled:opacity-50"
          disabled={disabled || isSubmitting || validating}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      {password && (
        <div className="space-y-1.5 pl-1">
          <p className="text-xs text-slate-400">Requisitos:</p>
          <div className="grid grid-cols-2 gap-1.5">
            {passwordRequirements.map((req) => (
              <div
                key={req.label}
                className={`flex items-center gap-1.5 text-xs ${
                  req.test(password) ? 'text-green-400' : 'text-slate-500'
                }`}
              >
                <CheckCircle className={`w-3.5 h-3.5 ${req.test(password) ? 'fill-current' : 'opacity-30'}`} />
                <span>{req.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Input
        label="Confirmar Contraseña *"
        type={showPassword ? 'text' : 'password'}
        placeholder="Repetí tu contraseña"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
        disabled={disabled || isSubmitting || validating}
      />

      <Select
        label="Tipo de Persona *"
        options={[
          { value: 'fisica', label: 'Persona Física' },
          { value: 'juridica', label: 'Persona Jurídica' },
        ]}
        error={errors.tipo_persona?.message}
        {...register('tipo_persona')}
        disabled={disabled || isSubmitting || validating}
      />
    </form>
  );
}