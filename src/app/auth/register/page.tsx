'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Eye, EyeOff } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe tener mayúscula, minúscula y número'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellido: z.string().optional(),
  tipo_persona: z.enum(['fisica', 'juridica'], { required_error: 'Seleccioná un tipo' }),
  cuit_cuil: z.string().optional(),
  dni: z.string().optional(),
  telefono: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { tipo_persona: 'fisica' },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      clearError();
      await registerUser(data);
      router.push('/dashboard');
    } catch {}
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white">Crear Cuenta</h1>
              <p className="text-slate-400 mt-2">Registrate en Contrato Directo</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Nombre"
                placeholder="Tu nombre"
                error={errors.nombre?.message}
                {...register('nombre')}
              />

              <Input
                label="Apellido (opcional)"
                placeholder="Tu apellido"
                error={errors.apellido?.message}
                {...register('apellido')}
              />

              <Input
                label="Email"
                type="email"
                placeholder="tu@email.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="relative">
                <Input
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <Select
                label="Tipo de Persona"
                options={[
                  { value: 'fisica', label: 'Persona Física' },
                  { value: 'juridica', label: 'Persona Jurídica' },
                ]}
                error={errors.tipo_persona?.message}
                {...register('tipo_persona')}
              />

              <Input
                label="CUIT/CUIL (opcional)"
                placeholder="XX-XXXXXXXX-X"
                error={errors.cuit_cuil?.message}
                {...register('cuit_cuil')}
              />

              <Input
                label="DNI (opcional)"
                placeholder="12345678"
                error={errors.dni?.message}
                {...register('dni')}
              />

              <Input
                label="Teléfono (opcional)"
                placeholder="+54 11 1234-5678"
                error={errors.telefono?.message}
                {...register('telefono')}
              />

              <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                Crear Cuenta
              </Button>
            </form>

            <p className="text-center text-slate-400 text-sm mt-6">
              ¿Ya tenés cuenta?{' '}
              <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
                Iniciá Sesión
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
