import api, { extractData } from './api';
import type {
  ConexionMercadoPago,
  EstadoMercadoPagoProveedor,
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
