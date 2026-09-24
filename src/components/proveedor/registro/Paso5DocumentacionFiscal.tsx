'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { FileText, Upload, Eye, CheckCircle, AlertCircle } from 'lucide-react';

const paso5Schema = z.object({
  documentacion_fiscal_url: z.string().url('URL inválida').min(1, 'La URL es obligatoria'),
  observaciones: z.string().max(500).optional(),
});

type Paso5Form = z.infer<typeof paso5Schema>;

interface Paso5DocumentacionFiscalProps {
  onNext: (data: Paso5Form) => Promise<void>;
  onBack: () => void;
  initialData?: Partial<Paso5Form>;
  disabled?: boolean;
}

export default function Paso5DocumentacionFiscal({
  onNext,
  onBack,
  initialData,
  disabled,
}: Paso5DocumentacionFiscalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [checkingUrl, setCheckingUrl] = useState(false);
  const [urlValid, setUrlValid] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Paso5Form>({
    resolver: zodResolver(paso5Schema),
    defaultValues: {
      ...initialData,
    },
    mode: 'onBlur',
  });

  const url = watch('documentacion_fiscal_url');

  const checkUrl = useCallback(async (value: string) => {
    if (!value || !value.startsWith('http')) {
      setUrlValid('idle');
      setPreviewUrl(null);
      return;
    }
    setCheckingUrl(true);
    setUrlValid('idle');
    try {
      const res = await fetch(value, { method: 'HEAD', mode: 'no-cors' });
      setUrlValid('valid');
      if (value.match(/\.(pdf|jpg|jpeg|png|webp)$/i)) {
        setPreviewUrl(value);
      } else {
        setPreviewUrl(null);
      }
    } catch {
      setUrlValid('invalid');
      setPreviewUrl(null);
    } finally {
      setCheckingUrl(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => checkUrl(url), 1000);
    return () => clearTimeout(timer);
  }, [url, checkUrl]);

  const handleSubmitForm = async (data: Paso5Form) => {
    await onNext(data);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={disabled || isSubmitting}>
          ← Volver
        </Button>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 text-slate-300 text-sm mb-3">
          <FileText className="w-4 h-4" />
          <span>Documentación fiscal requerida: Constancia de inscripción AFIP, DNI, y comprobante de domicilio</span>
        </div>
        <p className="text-xs text-slate-500">Subí los archivos a tu almacenamiento (Google Drive, Dropbox, OneDrive, etc.) y pegá el enlace público aquí.</p>
      </div>

      <div className="relative">
        <Input
          label="URL de documentación fiscal *"
          placeholder="https://drive.google.com/... o https://dropbox.com/..."
          error={errors.documentacion_fiscal_url?.message}
          {...register('documentacion_fiscal_url')}
          disabled={disabled || isSubmitting}
        />
        {checkingUrl && (
          <div className="absolute right-3 top-9 text-slate-400">
            <Upload className="animate-spin w-5 h-5" />
          </div>
        )}
        {urlValid === 'valid' && !checkingUrl && (
          <div className="absolute right-3 top-9 text-green-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        )}
        {urlValid === 'invalid' && !checkingUrl && (
          <div className="absolute right-3 top-9 text-red-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        )}
      </div>

      {previewUrl && (
        <div className="border border-slate-700 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-700">
            <span className="text-sm text-slate-300">Vista previa</span>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              Abrir
            </a>
          </div>
          <div className="aspect-video bg-slate-900 flex items-center justify-center">
            {previewUrl.match(/\.(pdf)$/i) ? (
              <FileText className="w-16 h-16 text-red-500" />
            ) : (
              <img src={previewUrl} alt="Preview" className="max-w-full max-h-[400px] object-contain" />
            )}
          </div>
        </div>
      )}

      <textarea
        {...register('observaciones')}
        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent min-h-[80px] resize-y"
        placeholder="Observaciones adicionales (opcional)..."
        maxLength={500}
        disabled={disabled || isSubmitting}
      />
      <p className="text-xs text-slate-500 text-right">{watch('observaciones')?.length || 0}/500</p>
      {errors.observaciones && <p className="text-sm text-red-400">{errors.observaciones.message}</p>}

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