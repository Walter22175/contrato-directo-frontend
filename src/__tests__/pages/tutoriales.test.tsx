/**
 * @jest-environment jsdom
 */
import './setup';
import { render, screen } from '@testing-library/react';
import api from '@/lib/api';
import TutorialesPage from '@/app/ayuda/tutoriales/page';

const apiGet = api.get as jest.Mock;

const tutoriales = [
  {
    id_tutorial: 1,
    titulo: 'Cómo registrarse como cliente',
    descripcion: 'Pasos para crear tu cuenta.',
    categoria: 'Primeros pasos',
    tipo_contenido: 'articulo',
    duracion_segundos: 120,
    veces_visto: 10,
  },
  {
    id_tutorial: 2,
    titulo: 'Cómo buscar y contratar un servicio',
    descripcion: 'Encontrá al proveedor adecuado.',
    categoria: 'Contratación',
    tipo_contenido: 'articulo',
    duracion_segundos: 180,
    veces_visto: 8,
  },
  {
    id_tutorial: 3,
    titulo: 'Cómo realizar un pago',
    descripcion: 'Pagos protegidos en custodia.',
    categoria: 'Pagos',
    tipo_contenido: 'video',
    duracion_segundos: 240,
    veces_visto: 5,
  },
];

beforeEach(() => {
  apiGet.mockImplementation((url: string) => {
    const data =
      url === '/centro-ayuda/tutoriales/categorias'
        ? [
            { categoria: 'Primeros pasos', total: 1 },
            { categoria: 'Contratación', total: 1 },
            { categoria: 'Pagos', total: 1 },
          ]
        : tutoriales;
    return Promise.resolve({
      data: { statusCode: 200, timestamp: '', data },
    });
  });
});

describe('TutorialesPage', () => {
  it('renders the page title', async () => {
    render(<TutorialesPage />);
    expect(screen.getByText('Tutoriales Paso a Paso')).toBeInTheDocument();
  });

  it('renders tutorial cards', async () => {
    render(<TutorialesPage />);

    expect(
      await screen.findByText('Cómo registrarse como cliente'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Cómo buscar y contratar un servicio'),
    ).toBeInTheDocument();
    expect(screen.getByText('Cómo realizar un pago')).toBeInTheDocument();
  });
});
