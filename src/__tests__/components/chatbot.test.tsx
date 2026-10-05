/**
 * @jest-environment jsdom
 */
import '../pages/setup';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import Chatbot from '@/components/ayuda/Chatbot';
import api from '@/lib/api';

const postMock = api.post as unknown as jest.Mock;

describe('Chatbot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    postMock.mockImplementation((url: string) => {
      if (url === '/chatbot/conversacion') {
        return Promise.resolve({
          data: {
            statusCode: 201,
            timestamp: '',
            data: { conversacion: { id_conversacion: 'conv-1' }, mensajeInicial: {} },
          },
        });
      }
      return Promise.resolve({ data: { statusCode: 201, timestamp: '', data: {} } });
    });
  });

  it('renders the chat button initially', () => {
    render(<Chatbot />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('opens the chat with suggestions and without the WhatsApp button', async () => {
    render(<Chatbot />);
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Abrir asistente virtual'));
    });

    expect(screen.getByText('Asistente Virtual')).toBeInTheDocument();
    expect(screen.getByText('¿Cómo me registro?')).toBeInTheDocument();
    expect(screen.getByText('¿Cómo pago?')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Hablar con un agente por WhatsApp/ })
    ).not.toBeInTheDocument();
  });

  it('answers a known question with a link and notifies the backend', async () => {
    render(<Chatbot />);
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Abrir asistente virtual'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('¿Cómo me registro?'));
    });

    await waitFor(() => {
      expect(screen.getByRole('link', { name: '/auth/register' })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/chatbot/conversacion', {
        mensaje_inicial: '¿Cómo me registro?',
      });
      expect(api.post).toHaveBeenCalledWith(
        '/chatbot/mensaje',
        expect.objectContaining({
          id_conversacion: 'conv-1',
          mensaje: '¿Cómo me registro?',
          intencion: 'registro_cliente',
        })
      );
    });

    expect(
      screen.queryByRole('button', { name: '¿Cómo me registro?' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Hablar con un agente por WhatsApp/ })
    ).not.toBeInTheDocument();
  });

  it('falls back to WhatsApp support for unknown questions', async () => {
    render(<Chatbot />);
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Abrir asistente virtual'));
    });

    const input = screen.getByPlaceholderText('Escribí tu pregunta...');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'zzz pregunta sin sentido zzz' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Enviar'));
    });

    await waitFor(() => {
      expect(screen.getByText(/No estoy seguro de poder ayudarte con eso/)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/chatbot/mensaje',
        expect.objectContaining({ intencion: 'fallback' })
      );
    });

    expect(
      screen.getByRole('link', { name: /Hablar con un agente por WhatsApp/ })
    ).toHaveAttribute('href', expect.stringContaining('wa.me'));
  });
});
