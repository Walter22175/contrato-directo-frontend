'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { extractData } from '@/lib/api';

export interface PasoData {
  paso: number;
  datos: Record<string, any>;
  completado: boolean;
}

export interface RegistroProveedorDraft {
  id_draft: number;
  id_usuario: string;
  paso_actual: number;
  datos_paso_1: Record<string, any> | null;
  datos_paso_2: Record<string, any> | null;
  datos_paso_3: Record<string, any> | null;
  datos_paso_4: Record<string, any> | null;
  datos_paso_5: Record<string, any> | null;
  datos_paso_6: Record<string, any> | null;
  completado: boolean;
  fecha_completado: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

const STORAGE_KEY = 'registro_proveedor_draft';

export function useRegistroProveedorDraft() {
  const [draft, setDraft] = useState<RegistroProveedorDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFromStorage = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDraft(parsed);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const saveToStorage = useCallback((data: RegistroProveedorDraft) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    loadFromStorage();
    setLoading(false);
  }, [loadFromStorage]);

  const iniciarRegistro = async (): Promise<RegistroProveedorDraft> => {
    setSaving(true);
    setError(null);
    try {
      const res = await api.post('/registro-proveedor/iniciar');
      const data = extractData<RegistroProveedorDraft>(res);
      setDraft(data);
      saveToStorage(data);
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al iniciar registro';
      setError(msg);
      throw new Error(msg);
    } finally {
      setSaving(false);
    }
  };

  const getProgreso = async (): Promise<RegistroProveedorDraft> => {
    setSaving(true);
    setError(null);
    try {
      const res = await api.get('/registro-proveedor/progreso');
      const data = extractData<RegistroProveedorDraft>(res);
      setDraft(data);
      saveToStorage(data);
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al obtener progreso';
      setError(msg);
      throw new Error(msg);
    } finally {
      setSaving(false);
    }
  };

  const guardarPaso = async (paso: number, datos: Record<string, any>): Promise<RegistroProveedorDraft> => {
    setSaving(true);
    setError(null);
    try {
      const res = await api.patch(`/registro-proveedor/paso/${paso}`, datos);
      const data = extractData<RegistroProveedorDraft>(res);
      setDraft(data);
      saveToStorage(data);
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || `Error al guardar paso ${paso}`;
      setError(msg);
      throw new Error(msg);
    } finally {
      setSaving(false);
    }
  };

  const validarPaso1 = async (datos: Record<string, any>): Promise<{ valido: boolean; mensaje?: string }> => {
    setError(null);
    try {
      const res = await api.post('/registro-proveedor/paso/1/validar', datos);
      return extractData(res);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error validando paso 1';
      setError(msg);
      return { valido: false, mensaje: msg };
    }
  };

  const validarPaso2 = async (datos: Record<string, any>): Promise<{ valido: boolean; mensaje?: string }> => {
    setError(null);
    try {
      const res = await api.post('/registro-proveedor/paso/2/validar', datos);
      return extractData(res);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error validando paso 2';
      setError(msg);
      return { valido: false, mensaje: msg };
    }
  };

  const validarCuitAfip = async (cuit: string): Promise<any> => {
    try {
      const res = await api.get(`/afip-validation/cuit/${cuit}`);
      return extractData(res);
    } catch {
      return null;
    }
  };

  const completarRegistro = async (dtoPaso6: Record<string, any>): Promise<any> => {
    setSaving(true);
    setError(null);
    try {
      const res = await api.post('/registro-proveedor/completar', dtoPaso6);
      const data = extractData(res);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      setDraft(null);
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error completando registro';
      setError(msg);
      throw new Error(msg);
    } finally {
      setSaving(false);
    }
  };

  const cancelarRegistro = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      await api.delete('/registro-proveedor/cancelar');
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      setDraft(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error cancelando registro';
      setError(msg);
      throw new Error(msg);
    } finally {
      setSaving(false);
    }
  };

  const clearError = useCallback(() => setError(null), []);

  return {
    draft,
    loading,
    saving,
    error,
    clearError,
    iniciarRegistro,
    getProgreso,
    guardarPaso,
    validarPaso1,
    validarPaso2,
    validarCuitAfip,
    completarRegistro,
    cancelarRegistro,
  };
}