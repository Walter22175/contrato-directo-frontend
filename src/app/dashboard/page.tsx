'use client';

import { useAuthStore } from '@/store/auth';
import { Card, CardTitle } from '@/components/ui/Card';
import { CreditCard, FileText, Star, TrendingUp, Clock, CheckCircle } from 'lucide-react';

const stats = [
  { label: 'Transacciones', value: '12', change: '+3 este mes', icon: CreditCard, color: 'text-cyan-400' },
  { label: 'Contratos Activos', value: '5', change: '2 pendientes', icon: FileText, color: 'text-blue-400' },
  { label: 'Valoración Promedio', value: '4.8', change: '23 reseñas', icon: Star, color: 'text-yellow-400' },
  { label: 'Ingresos del Mes', value: '$45.000', change: '+12%', icon: TrendingUp, color: 'text-green-400' },
];

const recentActivity = [
  { title: 'Nuevo contrato firmado', description: 'Plomería - Juan Pérez', time: 'Hace 2 horas', icon: CheckCircle, color: 'text-green-400' },
  { title: 'Pago recibido', description: '$12.500 - Servicio de pintura', time: 'Hace 5 horas', icon: CreditCard, color: 'text-cyan-400' },
  { title: 'Valoración pendiente', description: 'Dejá tu opinión sobre el servicio', time: 'Ayer', icon: Star, color: 'text-yellow-400' },
  { title: 'Contrato en revisión', description: 'Esperando firma del proveedor', time: 'Hace 2 días', icon: Clock, color: 'text-slate-400' },
];

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Hola, {user?.nombre} 👋
        </h1>
        <p className="text-slate-400 mt-1">Bienvenido a tu panel de control</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{stat.change}</p>
                </div>
                <div className={`p-2 bg-slate-700/50 rounded-lg ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardTitle>Actividad Reciente</CardTitle>
        <div className="mt-4 space-y-4">
          {recentActivity.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-start gap-3 pb-4 border-b border-slate-700/50 last:border-0 last:pb-0">
                <div className={`p-2 bg-slate-700/50 rounded-lg ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">{item.time}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
