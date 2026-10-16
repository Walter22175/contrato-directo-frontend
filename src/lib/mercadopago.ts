import api, { extractData } from './api';
import type {
  ConexionMercadoPago,
  DashboardMercadoPagoProveedor,
  EstadoMercadoPagoProveedor,
  MetricasMercadoPago,
  ResultadoCallbackMercadoPago,
} from '@/types';

/**
 * Onboarding OAuth de Mercado Pago del proveedor. El id del proveedor es el
 * propio usuario (ownership validado en backend).
 */
export async function obtenerEstadoMercadoPago(
  idProveedor: string,
): Promise<EstadoMercadoPagoProveedor> {
  const res = await api.get(`/proveedores/${idProveedor}/mercadopago/estado`);
  return extractData<EstadoMercadoPagoProveedor>(res);
}

/** Pagos en curso, retenciones y alertas del proveedor (dashboard). */
export async function obtenerDashboardMercadoPago(
  idProveedor: string,
): Promise<DashboardMercadoPagoProveedor> {
  const res = await api.get(
    `/proveedores/${idProveedor}/mercadopago/dashboard`,
  );
  return extractData<DashboardMercadoPagoProveedor>(res);
}

export async function iniciarConexionMercadoPago(
  idProveedor: string,
): Promise<ConexionMercadoPago> {
  const res = await api.post(
    `/proveedores/${idProveedor}/mercadopago/conectar`,
  );
  return extractData<ConexionMercadoPago>(res);
}

/** Intercambia el code del callback de MP por los tokens (PKCE). */
export async function intercambiarCodigoMercadoPago(
  code: string,
  state: string,
): Promise<ResultadoCallbackMercadoPago> {
  const res = await api.get('/mercadopago/oauth/callback', {
    params: { code, state },
  });
  return extractData<ResultadoCallbackMercadoPago>(res);
}

/**
 * Métricas del marketplace para el panel admin (solo super admin).
 * `desde`/`hasta` (ISO 8601) acotan el conteo de fallas de token a un rango.
 */
export async function obtenerMetricasMercadoPago(params?: {
  desde?: string;
  hasta?: string;
}): Promise<MetricasMercadoPago> {
  const res = await api.get('/pagos/mercadopago/metricas', { params });
  return extractData<MetricasMercadoPago>(res);
}
