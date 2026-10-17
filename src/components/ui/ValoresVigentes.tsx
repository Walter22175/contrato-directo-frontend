'use client';

import { useConfigPublica } from '@/hooks/useConfigPublica';

/**
 * Porcentaje de comisión vigente ("8%", "10%", …). Renderiza el valor
 * de Config. Sistema; muestra el fallback solo mientras carga.
 */
export function ComisionPorcentaje({ className }: { className?: string }) {
  const { comision_porcentaje } = useConfigPublica();
  return (
    <span className={className}>{comision_porcentaje}%</span>
  );
}

/** Monto máximo de Servicios Rápidos/Express formateado en ARS. */
export function MontoExpress({ className }: { className?: string }) {
  const { monto_maximo_servicio_rapido } = useConfigPublica();
  return (
    <span className={className}>
      {monto_maximo_servicio_rapido.toLocaleString('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
      })}
    </span>
  );
}
