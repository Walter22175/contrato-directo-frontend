'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { FileText, Eye, Search } from 'lucide-react';
import type { Contrato } from '@/types';

const estadoColors: Record<string, string> = {
  borrador: 'text-slate-400 bg-slate-500/10',
  pendiente_firma: 'text-yellow-400 bg-yellow-500/10',
  firmado: 'text-green-400 bg-green-500/10',
  cancelado: 'text-slate-400 bg-slate-500/10',
};

export default function DocumentosPage() {
  const { user } = useAuthStore();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [tab, setTab] = useState<'todos' | 'pendientes' | 'firmados'>('todos');

  const fetchContratos = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (user?.id_usuario) params.id_usuario = user.id_usuario;
      if (tab === 'pendientes') params.estado = 'pendiente_firma';
      if (tab === 'firmados') params.estado = 'firmado';
      const res = await api.get('/contratos', { params });
      const data = extractData<any>(res);
      setContratos(data?.data || data || []);
    } catch {
      setContratos([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id_usuario, tab]);

  useEffect(() => { fetchContratos(); }, [fetchContratos]);

  const contratosFiltrados = contratos.filter((c) =>
    !busqueda || c.tipo_contrato?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const formatearFecha = (f: string) =>
    new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Mis Documentos y Contratos</h1>

      <div className="flex gap-1 border-b border-slate-700">
        {(['todos', 'pendientes', 'firmados'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            {t === 'todos' ? 'Todos' : t === 'pendientes' ? 'Pendientes' : 'Firmados'}
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar contratos..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : contratosFiltrados.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No tenés contratos</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {contratosFiltrados.map((c) => {
            const pdfUrl = c.url_pdf_firmado || c.url_pdf_borrador;
            return (
              <Card key={c.id_contrato}>
                <div className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-white truncate">
                        Contrato #{c.id_contrato}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${estadoColors[c.estado] || 'text-slate-400 bg-slate-500/10'}`}>
                        {c.estado}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{c.tipo_contrato}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                      <span>Transacción: #{c.id_transaccion}</span>
                      {c.fecha_firma_cliente && <span>Firmado: {formatearFecha(c.fecha_firma_cliente)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {pdfUrl && (
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                        title="Ver PDF"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
