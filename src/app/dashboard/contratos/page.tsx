'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../layout';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { extractData } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { FileText, Download, Pen, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { Contrato } from '@/types';

const estadoColors: Record<string, string> = {
  borrador: 'text-slate-400 bg-slate-700/50',
  pendiente_firma: 'text-yellow-400 bg-yellow-400/10',
  firmado: 'text-green-400 bg-green-400/10',
  cancelado: 'text-red-400 bg-red-400/10',
};

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContratos = async () => {
      try {
        const res = await api.get('/contratos');
        const raw = extractData<any>(res);
        setContratos(raw?.data || raw || []);
      } catch {
        setContratos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchContratos();
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Mis Contratos</h1>
        <p className="text-slate-400 mt-1">Gestioná y firmá tus contratos digitales</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : contratos.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Sin contratos</h2>
            <p className="text-slate-400">Tus contratos aparecerán aquí cuando inicies una transacción.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {contratos.map((c) => (
            <Card key={c.id_contrato}>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <FileText className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">
                      Contrato #{c.id_contrato.slice(0, 8)}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${estadoColors[c.estado] || 'text-slate-400'}`}>
                      {c.estado.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Tipo: {c.tipo_contrato} | Generado: {formatDate(c.fecha_generacion)}
                  </p>
                  {c.fecha_firma_cliente && (
                    <p className="text-xs text-green-400 mt-1">
                      Firmado por cliente el {formatDate(c.fecha_firma_cliente)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {c.url_pdf_firmado && (
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
                  )}
                  {c.estado === 'pendiente_firma' && (
                    <Button size="sm">
                      <Pen className="w-4 h-4 mr-1" />
                      Firmar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
