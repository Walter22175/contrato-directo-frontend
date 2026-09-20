'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Users, Briefcase, FileText, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  totalUsuarios: number;
  totalProveedores: number;
  totalTransacciones: number;
  totalReclamos: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({ totalUsuarios: 0, totalProveedores: 0, totalTransacciones: 0, totalReclamos: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const [usersRes, txRes, reclamosRes] = await Promise.allSettled([
        api.get('/usuarios', { params: { limite: 1 } }),
        api.get('/transacciones', { params: { limite: 1 } }),
        api.get('/reclamos', { params: { limite: 1 } }),
      ]);
      const usersData = usersRes.status === 'fulfilled' ? extractData<any>(usersRes.value) : null;
      const txData = txRes.status === 'fulfilled' ? extractData<any>(txRes.value) : null;
      const reclamosData = reclamosRes.status === 'fulfilled' ? extractData<any>(reclamosRes.value) : null;

      setStats({
        totalUsuarios: usersData?.meta?.total || usersData?.data?.length || 0,
        totalProveedores: 0,
        totalTransacciones: txData?.meta?.total || txData?.data?.length || 0,
        totalReclamos: reclamosData?.meta?.total || reclamosData?.data?.length || 0,
      });
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const cards = [
    { label: 'Usuarios', value: stats.totalUsuarios, icon: Users, color: 'text-cyan-400', href: '/dashboard/admin/usuarios' },
    { label: 'Proveedores', value: stats.totalProveedores, icon: Briefcase, color: 'text-green-400', href: '/dashboard/admin/usuarios' },
    { label: 'Transacciones', value: stats.totalTransacciones, icon: TrendingUp, color: 'text-yellow-400', href: '/dashboard/admin/reportes' },
    { label: 'Reclamos', value: stats.totalReclamos, icon: AlertTriangle, color: 'text-red-400', href: '/dashboard/reclamos' },
  ];

  const quickLinks = [
    { label: 'Gestión de Usuarios', description: 'Administrar usuarios, roles y verificaciones', icon: Users, href: '/dashboard/admin/usuarios' },
    { label: 'Gestión de Servicios', description: 'Administrar catálogo y categorías', icon: Briefcase, href: '/dashboard/admin/servicios' },
    { label: 'Reportes Agregados', description: 'Métricas y estadísticas de la plataforma', icon: Activity, href: '/dashboard/admin/reportes' },
    { label: 'Solicitudes de Cambio', description: 'Revisar solicitudes pendientes', icon: FileText, href: '/dashboard/admin/reportes' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link key={c.label} href={c.href}>
                <Card hover>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Icon className={`w-8 h-8 ${c.color}`} />
                      <span className="text-2xl font-bold text-white">{c.value}</span>
                    </div>
                    <p className="text-sm text-slate-400">{c.label}</p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickLinks.map((l) => {
          const Icon = l.icon;
          return (
            <Link key={l.label} href={l.href}>
              <Card hover>
                <div className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{l.label}</h3>
                    <p className="text-sm text-slate-400">{l.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
