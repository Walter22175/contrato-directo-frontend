/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen, act, fireEvent } from '@testing-library/react';
import api from '@/lib/api';
import AdminConfiguracionPage from '@/app/dashboard/admin/configuracion/page';

const apiGet = api.get as jest.Mock;
const apiPost = api.post as jest.Mock;

const respuesta = (data: unknown) =>
  Promise.resolve({ data: { statusCode: 200, timestamp: '', data } });

const configsMock = [
  { clave: 'MONTO_MAXIMO_SERVICIO_RAPIDO', valor: '50000', tipo_dato: 'decimal', descripcion: 'Monto express' },
  { clave: 'COMISION_PORCENTAJE_APP', valor: '8', tipo_dato: 'decimal', descripcion: 'Comisión' },
  { clave: 'IVA_ALICUOTA_GENERAL', valor: '21', tipo_dato: 'decimal', descripcion: 'Alícuota IVA' },
  { clave: 'IVA_PERCEPCION_ALICUOTA', valor: '3.00', tipo_dato: 'decimal', descripcion: 'Alícuota percepción' },
  { clave: 'IVA_PERCEPCION_RG5794_HABILITADA', valor: 'false', tipo_dato: 'string', descripcion: 'Percepción' },
  { clave: 'VENTA_PRODUCTOS_HABILITADA', valor: 'false', tipo_dato: 'string', descripcion: 'Venta productos' },
];

describe('AdminConfiguracionPage', () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiGet.mockImplementation(() => respuesta(configsMock));
    apiPost.mockImplementation(() => respuesta({}));
  });

  it('renderiza el título de la página', async () => {
    await act(async () => {
      render(<AdminConfiguracionPage />);
    });
    expect(screen.getByText('Configuración del Sistema')).toBeInTheDocument();
  });

  it('renderiza la sección IVA y venta de productos con las 4 claves', async () => {
    await act(async () => {
      render(<AdminConfiguracionPage />);
    });
    expect(screen.getByText('IVA y Venta de Productos (RG 5794/2025)')).toBeInTheDocument();
    expect(screen.getByText('Venta de productos habilitada')).toBeInTheDocument();
    expect(screen.getByText('Percepción RG 5794 habilitada')).toBeInTheDocument();
    expect(screen.getByLabelText('Alícuota general de IVA (%)')).toHaveValue(21);
    expect(screen.getByLabelText('Alícuota de percepción sobre comisión (%)')).toHaveValue(3);
  });

  it('muestra los flags apagados por defecto', async () => {
    await act(async () => {
      render(<AdminConfiguracionPage />);
    });
    expect(
      screen.getByRole('switch', { name: 'Venta de productos habilitada' }),
    ).toHaveAttribute('aria-checked', 'false');
    expect(
      screen.getByRole('switch', { name: 'Percepción RG 5794 habilitada' }),
    ).toHaveAttribute('aria-checked', 'false');
  });

  it('enciende la venta de productos al activar el toggle', async () => {
    await act(async () => {
      render(<AdminConfiguracionPage />);
    });
    const toggle = screen.getByRole('switch', { name: 'Venta de productos habilitada' });
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(apiPost).toHaveBeenCalledWith(
      '/configuracion',
      expect.objectContaining({
        clave: 'VENTA_PRODUCTOS_HABILITADA',
        valor: 'true',
        tipo_dato: 'string',
        id_usuario_modifico: 'test-user-id',
      }),
    );
    expect(
      screen.getByRole('switch', { name: 'Venta de productos habilitada' }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText(/"VENTA_PRODUCTOS_HABILITADA" actualizada a true/)).toBeInTheDocument();
  });

  it('guarda la alícuota general de IVA editada', async () => {
    await act(async () => {
      render(<AdminConfiguracionPage />);
    });
    fireEvent.change(screen.getByLabelText('Alícuota general de IVA (%)'), {
      target: { value: '22.5' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Guardar alícuota general' }));
    });
    expect(apiPost).toHaveBeenCalledWith(
      '/configuracion',
      expect.objectContaining({
        clave: 'IVA_ALICUOTA_GENERAL',
        valor: '22.5',
        tipo_dato: 'decimal',
        id_usuario_modifico: 'test-user-id',
      }),
    );
    expect(screen.getByText(/"IVA_ALICUOTA_GENERAL" actualizada a 22.5/)).toBeInTheDocument();
  });

  it('guarda la alícuota de percepción editada', async () => {
    await act(async () => {
      render(<AdminConfiguracionPage />);
    });
    fireEvent.change(screen.getByLabelText('Alícuota de percepción sobre comisión (%)'), {
      target: { value: '4' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Guardar alícuota de percepción' }));
    });
    expect(apiPost).toHaveBeenCalledWith(
      '/configuracion',
      expect.objectContaining({
        clave: 'IVA_PERCEPCION_ALICUOTA',
        valor: '4',
        tipo_dato: 'decimal',
        id_usuario_modifico: 'test-user-id',
      }),
    );
    expect(screen.getByText(/"IVA_PERCEPCION_ALICUOTA" actualizada a 4/)).toBeInTheDocument();
  });
});
