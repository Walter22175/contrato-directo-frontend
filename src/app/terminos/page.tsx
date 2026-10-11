'use client';

import { useState, useEffect } from 'react';
import api, { extractData } from '@/lib/api';
import { Scale, Loader2 } from 'lucide-react';

interface DocumentoLegal {
  version: string;
  contenido: string;
  tipo: string;
}

export default function TerminosPage() {
  const [doc, setDoc] = useState<DocumentoLegal | null>(null);
  const [error, setError] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .get('/legales/terminos')
      .then((res) => setDoc(extractData<DocumentoLegal>(res)))
      .catch(() => setError(true))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Scale className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Términos y Condiciones</h1>
            {doc && <p className="text-sm text-slate-400">Versión {doc.version}</p>}
          </div>
        </div>

        {cargando && (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Cargando documento legal…</span>
          </div>
        )}

        {error && (
          <p className="text-red-400">No se pudieron cargar los Términos y Condiciones.</p>
        )}

        {doc && (
          <article className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300">
              {doc.contenido}
            </pre>
          </article>
        )}
      </div>
    </div>
  );
}
