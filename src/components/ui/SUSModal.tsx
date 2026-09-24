'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import { CheckCircle, XCircle, Star } from 'lucide-react';

const susSchema = z.object({
  q1: z.number().min(1).max(5),
  q2: z.number().min(1).max(5),
  q3: z.number().min(1).max(5),
  q4: z.number().min(1).max(5),
  q5: z.number().min(1).max(5),
  q6: z.number().min(1).max(5),
  q7: z.number().min(1).max(5),
  q8: z.number().min(1).max(5),
  q9: z.number().min(1).max(5),
  q10: z.number().min(1).max(5),
  comentarios: z.string().max(500).optional(),
});

type SUSForm = z.infer<typeof susSchema>;

const QUESTIONS = [
  'Me gustaría usar este sistema frecuentemente',
  'Encontré el sistema innecesariamente complejo',
  'Pensé que el sistema era fácil de usar',
  'Creo que necesitaría ayuda de una persona técnica para usar este sistema',
  'Encontré que las diversas funciones del sistema estaban bien integradas',
  'Pensé que había demasiada inconsistencia en este sistema',
  'Imagino que la mayoría de la gente aprendería a usar este sistema muy rápido',
  'Encontré el sistema muy torpe de usar',
  'Me sentí muy seguro usando el sistema',
  'Necesité aprender muchas cosas antes de poder usar este sistema',
];

const ODD_QUESTIONS = [1, 3, 5, 7, 9];
const EVEN_QUESTIONS = [2, 4, 6, 8, 10];

interface SUSModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (score: number, responses: SUSForm) => Promise<void>;
  context: 'cliente' | 'proveedor';
  disabled?: boolean;
}

export default function SUSModal({ open, onClose, onSubmit, context, disabled }: SUSModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SUSForm>({
    resolver: zodResolver(susSchema),
    defaultValues: {
      q1: 3, q2: 3, q3: 3, q4: 3, q5: 3,
      q6: 3, q7: 3, q8: 3, q9: 3, q10: 3,
      comentarios: '',
    },
    mode: 'onChange',
  });

  const responses = watch();

  useEffect(() => {
    let oddSum = 0, evenSum = 0;
    ODD_QUESTIONS.forEach(q => { oddSum += (responses[`q${q}` as keyof SUSForm] as number) - 1; });
    EVEN_QUESTIONS.forEach(q => { evenSum += 5 - (responses[`q${q}` as keyof SUSForm] as number); });
    const total = (oddSum + evenSum) * 2.5;
    setScore(Math.round(total));
  }, [responses]);

  const handleSubmitForm = async (data: SUSForm) => {
    setSubmitting(true);
    try {
      await onSubmit(score, data);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Encuesta de Usabilidad (SUS)</h2>
            <p className="text-slate-400 text-sm mt-1">
              Tu opinión nos ayuda a mejorar. Solo te tomará 1 minuto.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            <XCircle className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(handleSubmitForm)} className="p-6 space-y-6">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">Puntuación SUS en tiempo real:</span>
              <div className="text-3xl font-bold text-cyan-400">{score}/100</div>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300"
                style={{ width: `${score}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0</span><span>25</span><span>50</span><span>68 (promedio)</span><span>75 (objetivo)</span><span>100</span>
            </div>
          </div>

          <div className="space-y-5">
            {QUESTIONS.map((question, i) => {
              const qNum = i + 1;
              const isOdd = ODD_QUESTIONS.includes(qNum);
              return (
                <div key={qNum} className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    {qNum}. {question} {isOdd ? '(Positivo)' : '(Negativo)'}
                  </label>
                  <div className="flex gap-2" role="radiogroup" aria-label={question}>
                    {[1, 2, 3, 4, 5].map((value) => {
                      const fieldName = `q${qNum}` as keyof SUSForm;
                      return (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={responses[fieldName] === value}
                          onClick={() => setValue(fieldName, value, { shouldValidate: true })}
                          disabled={disabled || submitting}
                          className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                            responses[fieldName] === value
                              ? isOdd
                                ? 'bg-green-500/20 border-green-500 text-green-400'
                                : 'bg-red-500/20 border-red-500 text-red-400'
                              : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white'
                          } border`}
                        >
                          {value === 1 && 'Totalmente en desacuerdo'}
                          {value === 2 && 'En desacuerdo'}
                          {value === 3 && 'Neutral'}
                          {value === 4 && 'De acuerdo'}
                          {value === 5 && 'Totalmente de acuerdo'}
                        </button>
                      );
                    })}
                  </div>
                  {errors[`q${qNum}` as keyof SUSForm] && (
                    <p className="text-xs text-red-400">{errors[`q${qNum}` as keyof SUSForm]?.message}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Comentarios adicionales (opcional)
            </label>
            <textarea
              {...register('comentarios')}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent min-h-[80px] resize-y"
              placeholder="¿Qué mejorarías? ¿Qué te gustó más?"
              maxLength={500}
              disabled={disabled || submitting}
            />
            <p className="text-xs text-slate-500 text-right mt-1">
              {responses.comentarios?.length || 0}/500
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Omitir
            </Button>
            <Button type="submit" isLoading={submitting} disabled={disabled}>
              Enviar ({score}/100)
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}