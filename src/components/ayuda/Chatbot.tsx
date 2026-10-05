'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Bot, User, Send, X, MessageCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import api, { extractData } from '@/lib/api';

// ============================================================
// CONFIGURACIÓN
// ============================================================
const WHATSAPP_NUMERO = '5491134223136'; // +54 11 3422 3136
const WHATSAPP_MENSAJE = encodeURIComponent(
  'Hola, vengo del asistente virtual CoDi de Contrato Directo. Necesito ayuda con:'
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMERO}?text=${WHATSAPP_MENSAJE}`;

const API_CONVERSACION = '/chatbot/conversacion';
const API_MENSAJE = '/chatbot/mensaje';

// ============================================================
// TIPOS
// ============================================================
interface Mensaje {
  id: number;
  remitente: 'usuario' | 'bot';
  contenido: string;
  fecha: Date;
}

interface Intencion {
  id: string;
  keywords: string[];
  frases?: string[];
  respuesta: string;
}

// ============================================================
// UTILIDADES DE TEXTO
// ============================================================
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// INTENCIONES (alineadas a la documentación oficial)
// ============================================================
const INTENCIONES: Intencion[] = [
  // ---- Saludos / cierre ----
  {
    id: 'saludo',
    keywords: ['hola', 'buenas', 'buen dia', 'buenas tardes', 'buenas noches', 'que tal', 'hey'],
    frases: ['hola como estas', 'buen dia'],
    respuesta: '¡Hola! Soy **CoDi**, el asistente virtual de **Contrato Directo**. Puedo ayudarte con registros, pagos, contratos, valoraciones, mediación y más. ¿Qué necesitás?',
  },
  {
    id: 'gracias',
    keywords: ['gracias', 'mil gracias', 'muchas gracias', 'genial', 'perfecto', 'buenisimo'],
    respuesta: '¡De nada! Si necesitás algo más, acá estoy. 😊',
  },
  {
    id: 'despedida',
    keywords: ['chau', 'adios', 'nos vemos', 'hasta luego', 'bye'],
    respuesta: '¡Hasta luego! Que tengas un buen día. 👋',
  },

  // ---- Registro y cuentas (RF-01, RF-02, RF-03, Obj. 3) ----
  {
    id: 'registro_cliente',
    keywords: ['registr', 'crear cuenta', 'darme de alta', 'crear usuario', 'registro cliente', 'inscribir'],
    frases: ['como me registro', 'quiero crear una cuenta', 'donde me registro'],
    respuesta: 'Para registrarte como **cliente**, andá a [/auth/register](/auth/register) y completá el formulario en **3 pasos** (menos de 2 minutos). Solo necesitás email y una contraseña segura.',
  },
  {
    id: 'registro_proveedor',
    keywords: ['proveedor', 'ofrecer servicio', 'ser proveedor', 'registro proveedor', 'trabajar'],
    frases: ['como me hago proveedor', 'quiero ofrecer mis servicios'],
    respuesta: 'Para registrarte como **proveedor**, tenés que completar: email, contraseña, DNI, CUIT, dirección, teléfono, **documentación fiscal**, rubro y avales. Son **6 pasos** (menos de 5 minutos). Ingresá a [/auth/register](/auth/register) y elegí la opción **Proveedor**.',
  },
  {
    id: 'verificacion_proveedor',
    keywords: ['verificacion', 'sello', 'verificado', 'documentacion', 'validar'],
    frases: ['que es el sello de proveedor verificado', 'cuanto tarda la verificacion'],
    respuesta: 'El **Sello de Proveedor Verificado** se otorga cuando validamos tu identidad y documentación fiscal. El plazo máximo es de **48 horas hábiles** (idealmente 24h). Si superás la validación, obtenés el sello y más visibilidad en las búsquedas.',
  },
  {
    id: 'conversion_rol',
    keywords: ['convertir', 'cambiar rol', 'cliente a proveedor', 'rol dual', 'ambos roles'],
    frases: ['puedo ser cliente y proveedor', 'como paso de cliente a proveedor'],
    respuesta: '¡Sí! Podés ser **cliente y proveedor** al mismo tiempo. Desde tu perfil, completá el formulario de proveedor (sin crear una cuenta nueva) y conservás tu rol de cliente. Podés alternar entre ambos con un solo clic. La validación tarda hasta **48 horas hábiles**.',
  },
  {
    id: 'recuperar_password',
    keywords: ['recuperar', 'olvide contraseña', 'resetear', 'cambiar contraseña', 'no puedo entrar'],
    respuesta: 'Podés recuperar tu contraseña desde [/auth/forgot-password](/auth/forgot-password). Te enviamos un email con el enlace para restablecerla. Si no te llega, revisá la carpeta de spam o escribinos.',
  },

  // ---- Catálogo y búsqueda (RF-09 a RF-14, Obj. 5, Obj. 8) ----
  {
    id: 'buscar_servicio',
    keywords: ['buscar', 'busco', 'encontrar', 'servicio', 'filtrar', 'categoria'],
    frases: ['como busco un servicio', 'donde veo los servicios'],
    respuesta: 'Podés buscar servicios desde [/servicios](/servicios). Tenés **filtros avanzados** por rubro, valoración (llaves), precio, antigüedad y distintivos. También podés ordenar por valoración, nombre o antigüedad. Las búsquedas tardan menos de **2 segundos**.',
  },
  {
    id: 'catalogo',
    keywords: ['catalogo', 'rubros', 'categorias', 'que servicios hay'],
    respuesta: 'El catálogo tiene **7 categorías**: Mantenimiento y Reparaciones Domiciliarias, Automóviles, Mascotas, Tecnología, Community Manager, Software y Paisajismo. En total son **57 servicios específicos**. Lo podés ver en [/servicios](/servicios).',
  },
  {
    id: 'nuevo_rubro',
    keywords: ['nuevo rubro', 'agregar servicio', 'solicitar rubro', 'no encuentro'],
    frases: ['como pido un nuevo rubro', 'no esta el servicio que busco'],
    respuesta: 'Si no encontrás el rubro o servicio que buscás, podés solicitar su incorporación desde [/servicios/solicitar-rubro](/servicios/solicitar-rubro). Se evalúa la demanda, viabilidad legal y oferta de proveedores. El plazo de respuesta es de hasta **15 días hábiles**.',
  },

  // ---- Contratación y pagos (RF-15 a RF-24, Obj. 6, T&C 8) ----
  {
    id: 'contratar',
    keywords: ['contratar', 'contratacion', 'como compro', 'pedir servicio', 'solicitar'],
    frases: ['como contrato un servicio', 'quiero contratar'],
    respuesta: 'El flujo es simple: **búsqueda → selección → pago → confirmación** (4 pasos, menos de 60 segundos el pago). Acordás el precio con el proveedor, pagás por Mercado Pago y el dinero queda **retenido en custodia** hasta que des tu conformidad.',
  },
  {
    id: 'pago',
    keywords: ['pago', 'pagar', 'cobrar', 'mercadopago', 'mercado pago', 'tarjeta', 'transferencia', 'abonar'],
    frases: ['como pago', 'que medios de pago aceptan'],
    respuesta: 'Los pagos se procesan con **Mercado Pago**: tarjetas de crédito, débito y transferencias bancarias. El dinero queda **retenido en custodia** y se libera al proveedor cuando das tu conformidad. No almacenamos datos de tarjetas (cumplimos **PCI DSS**).',
  },
  {
    id: 'comision',
    keywords: ['comision', 'porcentaje', 'cuanto cobran', 'cuanto se llevan', '8%', 'tarifa'],
    frases: ['cuanto es la comision', 'que porcentaje cobran'],
    respuesta: 'Contrato Directo cobra una **comisión del 8%** sobre el valor total del servicio. Se descuenta automáticamente del pago al proveedor. Es visible antes de confirmar la contratación. Se revisa anualmente con 30 días de aviso.',
  },
  {
    id: 'liberacion_pago',
    keywords: ['liberacion', 'conformidad', 'cuando cobra', 'cuando me pagan', 'liberar'],
    frases: ['cuando se libera el pago', 'cuando recibo el dinero'],
    respuesta: 'El pago se libera al proveedor **24 horas hábiles** después de tu conformidad. Si no das conformidad explícita en **72 horas hábiles**, se considera automática y se libera igual. Para proyectos extensos, se libera por **hitos**.',
  },
  {
    id: 'pagos_parcelados',
    keywords: ['parcelado', 'hitos', 'pagos parciales', 'por partes', 'cuotas'],
    frases: ['se puede pagar en partes', 'que son los hitos'],
    respuesta: '¡Sí! Para proyectos de más de **20 días hábiles** o con etapas diferenciadas, podés dividir el pago en hasta **10 hitos**. Cada hito se libera cuando el cliente da conformidad (48 horas hábiles para responder). No se acumulan comisiones adicionales.',
  },
  {
    id: 'servicio_max',
    keywords: ['max', 'servicio max', 'contrato', 'firma', 'pdf', '150', '150000', 'rapido'],
    frases: ['que es un servicio max', 'que es un servicio rapido', 'diferencia entre max y rapido'],
    respuesta: 'Los **Servicios Rápidos** son los que no superan **$150.000 ARS**: se aceptan con dos clics y no requieren firma. Los **Servicios Max** superan ese monto y requieren **contrato PDF con firma digital** de ambas partes (Ley 25.506).',
  },
  {
    id: 'firma_digital',
    keywords: ['firma', 'firmar', 'firma digital', 'docusign', 'adobe', 'certificado'],
    frases: ['como firmo el contrato', 'que es la firma digital'],
    respuesta: 'La firma digital se hace desde la plataforma con proveedores homologados (**DocuSign**, **Adobe Sign** o **AFIP**). Recibís una notificación, revisás el contrato PDF y firmás con un clic. Tiene validez legal según la **Ley 25.506**.',
  },
  {
    id: 'reembolso',
    keywords: ['reembolso', 'devolucion', 'devolver', 'reintegrar', 'garantia'],
    frases: ['como pido un reembolso', 'quiero que me devuelvan el dinero'],
    respuesta: 'Podés pedir reembolso total o parcial si el proveedor no cumple o hay vicios ocultos. Se abre un reclamo en [/dashboard/reclamos](/dashboard/reclamos), el proveedor tiene **72 horas hábiles** para responder y el equipo de mediación resuelve en hasta **5 días hábiles**. El reintegro se hace en un máximo de **10 días hábiles**.',
  },

  // ---- Valoraciones y reputación (RF-25 a RF-28, Obj. 7) ----
  {
    id: 'valoracion',
    keywords: ['valoracion', 'calificar', 'puntuar', 'llaves', 'estrellas', 'reseña', 'opinion'],
    frases: ['como valoro a un proveedor', 'que son las llaves'],
    respuesta: 'Después de cada transacción podés valorar a la otra parte con **5 llaves** (1 = Muy insatisfecho, 5 = Muy satisfecho) y un comentario de hasta **150 caracteres**. Tenés **7 días hábiles** para hacerlo. Es opcional y público.',
  },
  {
    id: 'ranking',
    keywords: ['ranking', 'destacado', 'proveedor destacado', 'posicion', 'visibilidad'],
    frases: ['que es proveedor destacado', 'como subo en el ranking'],
    respuesta: 'El **ranking** combina: valoración promedio (40%), antigüedad (20%), transacciones (20%), tasa de respuesta (10%) y cumplimiento (10%). Los proveedores con **≥ 4.5 llaves** y **≥ 10 valoraciones** reciben el distintivo **Proveedor Destacado**.',
  },
  {
    id: 'moderacion_reseña',
    keywords: ['moderacion', 'reseña rechazada', 'comentario eliminado', 'apelar valoracion'],
    respuesta: 'Los comentarios pasan por un filtro automático y, si es necesario, revisión manual (máx. **48 horas hábiles**). Podés apelar una valoración injusta desde el espacio de mediación; se resuelve en hasta **5 días hábiles**.',
  },

  // ---- Mediación y reclamos (RF-29 a RF-33, Obj. 9, T&C 12) ----
  {
    id: 'reclamo',
    keywords: ['reclamo', 'queja', 'problema', 'disputa', 'incumplimiento', 'denunciar'],
    frases: ['como abro un reclamo', 'quiero hacer un reclamo'],
    respuesta: 'Podés abrir un reclamo desde [/dashboard/reclamos/nuevo](/dashboard/reclamos/nuevo) dentro de los **15 días hábiles** posteriores al incidente. Adjuntá hasta **6 archivos** de 10 MB. El flujo tiene 5 etapas y una resolución en hasta **7 días hábiles** desde la asignación al mediador.',
  },
  {
    id: 'mediacion',
    keywords: ['mediacion', 'mediador', 'audiencia', 'conflicto', 'resolver'],
    frases: ['que es la mediacion', 'como funciona la mediacion'],
    respuesta: 'La **mediación** es el espacio formal para resolver conflictos entre clientes y proveedores. Etapas: apertura → contestación (5 días) → revisión del mediador (7 días) → resolución → cumplimiento. Podés apelar dentro de los **5 días hábiles**.',
  },
  {
    id: 'sancion',
    keywords: ['sancion', 'suspendido', 'cancelado', 'penalidad', 'bloqueado'],
    respuesta: 'Las sanciones por incumplimiento pueden ser: **amonestación**, **suspensión temporal** (7 a 30 días), **pérdida de distintivos**, **reducción de visibilidad**, **cancelación de cuenta** o **reporte a autoridades**. Se aplican tras una resolución de mediación firme.',
  },

  // ---- Atención al cliente y notificaciones (RF-34 a RF-39, Obj. 10, Obj. 11) ----
  {
    id: 'atencion',
    keywords: ['atencion', 'soporte', 'contacto', 'ayuda', 'agente', 'hablar con alguien', 'telefono'],
    frases: ['como contacto a soporte', 'quiero hablar con una persona'],
    respuesta: `Podés contactarnos por:\n• **WhatsApp**: [+54 11 3422 3136](${WHATSAPP_URL}) (L-V 9-20h, Sáb 9-14h)\n• **Email/Tickets**: 24/7 envío, atención L-V 8-20h\n• **Teléfono**: L-V 10-18h\n• **Centro de ayuda**: [/ayuda](/ayuda) (24/7)\n\n¿Querés que te derive a un agente por WhatsApp?`,
  },
  {
    id: 'horarios',
    keywords: ['horario', 'cuando atienden', 'a que hora', 'abierto', 'cerrado'],
    frases: ['cuales son los horarios de atencion'],
    respuesta: 'Nuestros horarios:\n• **Email/Tickets**: L-V 8:00 a 20:00\n• **WhatsApp**: L-V 9:00 a 20:00, Sáb 9:00 a 14:00\n• **Teléfono**: L-V 10:00 a 18:00\n• **Centro de ayuda**: 24/7\n• **Redes sociales**: L-V 9:00 a 18:00\n\nTodos los horarios son de Argentina (GMT-3).',
  },
  {
    id: 'ticket',
    keywords: ['ticket', 'seguimiento', 'estado consulta', 'numero de ticket'],
    respuesta: 'Cada consulta genera un **ticket único**. Podés ver el estado desde tu perfil en [/dashboard/tickets](/dashboard/tickets). Te notificamos por email y push cuando haya novedades.',
  },
  {
    id: 'notificaciones',
    keywords: ['notificacion', 'notificaciones', 'no me llegan', 'push', 'email', 'no molestar'],
    respuesta: 'Manejamos 3 tipos: **transaccionales** (obligatorias: registro, pago, conformidad), **actividad** (configurables) y **plataforma** (boletines, opcionales). Configurá tus preferencias desde [/dashboard/notificaciones](/dashboard/notificaciones), incluyendo **horario de no molestar**.',
  },

  // ---- Legal y privacidad ----
  {
    id: 'privacidad',
    keywords: ['privacidad', 'datos personales', 'mis datos', 'ley 25326', 'eliminar datos'],
    frases: ['como protegen mis datos', 'quiero eliminar mi cuenta'],
    respuesta: 'Cumplimos con la **Ley 25.326** de Protección de Datos Personales. Podés ejercer tus derechos de acceso, rectificación, supresión y oposición escribiendo a nuestro DPO. Más info en la Política de Privacidad: [/legal/privacidad](/legal/privacidad).',
  },
  {
    id: 'terminos',
    keywords: ['terminos', 'condiciones', 'contrato legal', 'ley'],
    respuesta: 'Podés leer los **Términos y Condiciones v3.0** en [/legal/terminos](/legal/terminos) y la **Política de Privacidad** en [/legal/privacidad](/legal/privacidad).',
  },
  {
    id: 'seguridad',
    keywords: ['seguridad', 'cifrado', 'pci', 'ssl', 'protegido'],
    respuesta: 'Usamos **HTTPS/TLS** en tránsito y **AES-256** en reposo. Los pagos cumplen **PCI DSS** (delegado a Mercado Pago). Tenemos autenticación **JWT**, control por roles (RBAC) y auditoría de acciones críticas.',
  },

  // ---- Expansión futura (Anexo H) ----
  {
    id: 'venta_productos',
    keywords: ['producto', 'productos', 'venta', 'comprar producto', 'vender producto'],
    frases: ['puedo vender productos', 'cuando habilitan la venta de productos'],
    respuesta: 'La venta de **productos** todavía **no está activa**. La plataforma reserva las capacidades técnicas, fiscales y legales para habilitarla en el futuro (ver Anexo H y RG 5794/2025 de ARCA). Por ahora solo se ofrecen **servicios**.',
  },
];

// ============================================================
// MATCHER CON SCORING
// ============================================================
function buscarIntencion(input: string): Intencion | null {
  const texto = normalizar(input);
  let mejor: { intencion: Intencion; score: number } | null = null;

  for (const intencion of INTENCIONES) {
    let score = 0;

    for (const kw of intencion.keywords) {
      const kwNorm = normalizar(kw);
      if (kwNorm && texto.includes(kwNorm)) score += 2;
    }
    for (const frase of intencion.frases ?? []) {
      const fraseNorm = normalizar(frase);
      if (fraseNorm && texto.includes(fraseNorm)) score += 5;
    }

    if (score > 0 && (!mejor || score > mejor.score)) {
      mejor = { intencion, score };
    }
  }

  return mejor && mejor.score >= 2 ? mejor.intencion : null;
}

// ============================================================
// RENDER: **negrita**, [texto](url), \n
// ============================================================
function renderContenido(texto: string) {
  const lineas = texto.split('\n');

  return lineas.map((linea, idxLinea) => (
    <span key={idxLinea}>
      {renderLinea(linea)}
      {idxLinea < lineas.length - 1 && <br />}
    </span>
  ));
}

function renderLinea(linea: string) {
  // Divide por negritas **...** o links [texto](url)
  const partes = linea.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);

  return partes.map((parte, i) => {
    // Negrita
    if (parte.startsWith('**') && parte.endsWith('**')) {
      return <strong key={i}>{parte.slice(2, -2)}</strong>;
    }
    // Link
    const matchLink = parte.match(/^\[(.*?)\]\((.*?)\)$/);
    if (matchLink) {
      const [, label, href] = matchLink;
      const esExterno = /^https?:\/\//.test(href);
      return esExterno ? (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-300 underline hover:text-cyan-200 inline-flex items-center gap-0.5"
        >
          {label}
          <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <Link
          key={i}
          href={href}
          className="text-cyan-300 underline hover:text-cyan-200"
        >
          {label}
        </Link>
      );
    }
    return <span key={i}>{parte}</span>;
  });
}

// ============================================================
// SUGERENCIAS RÁPIDAS
// ============================================================
const SUGERENCIAS = [
  '¿Cómo me registro?',
  '¿Cómo pago?',
  '¿Qué es un Servicio Max?',
  '¿Cuánto es la comisión?',
];

// ============================================================
// COMPONENTE
// ============================================================
export default function Chatbot() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: 1,
      remitente: 'bot',
      contenido:
        'Hola soy **CoDi** el asistente virtual de Contrato Directo. ¿En qué puedo ayudarte?',
      fecha: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const [mostrarWhatsapp, setMostrarWhatsapp] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idConversacionRef = useRef<string | null>(null);
  const promesaConversacionRef = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes, escribiendo]);

  const agregarMensaje = (msg: Omit<Mensaje, 'id' | 'fecha'>) => {
    setMensajes((prev) => [
      ...prev,
      { ...msg, id: Date.now() + Math.random(), fecha: new Date() },
    ]);
  };

  const obtenerIdConversacion = (mensajeInicial: string): Promise<string | null> => {
    if (idConversacionRef.current) return Promise.resolve(idConversacionRef.current);

    if (!promesaConversacionRef.current) {
      promesaConversacionRef.current = api
        .post(API_CONVERSACION, { mensaje_inicial: mensajeInicial })
        .then((res) => {
          const data = extractData<{ conversacion?: { id_conversacion?: string } }>(res);
          const id = data?.conversacion?.id_conversacion ?? null;
          idConversacionRef.current = id;
          return id;
        })
        .catch(() => {
          promesaConversacionRef.current = null;
          return null;
        });
    }

    return promesaConversacionRef.current;
  };

  const notificarBackend = (textoUsuario: string, idIntencion: string) => {
    obtenerIdConversacion(textoUsuario)
      .then((idConversacion) => {
        if (!idConversacion) return;
        return api.post(API_MENSAJE, {
          id_conversacion: idConversacion,
          mensaje: textoUsuario,
          intencion: idIntencion,
          timestamp: new Date().toISOString(),
        });
      })
      .catch(() => {
        /* silencioso: si falla, la conversación sigue en el front */
      });
  };

  const responder = (textoUsuario: string) => {
    setEscribiendo(true);

    setTimeout(() => {
      const intencion = buscarIntencion(textoUsuario);

      if (intencion) {
        agregarMensaje({ remitente: 'bot', contenido: intencion.respuesta });
      } else {
        // Fallback: sin recursos de respuesta, se libera la opción WhatsApp
        agregarMensaje({
          remitente: 'bot',
          contenido: `No estoy seguro de poder ayudarte con eso. 😅\n\nTe derivo con nuestro equipo de soporte por **WhatsApp**:\n[+54 11 3422 3136](${WHATSAPP_URL})\n\nTambién podés abrir un ticket en [/dashboard/tickets](/dashboard/tickets).`,
        });
        setMostrarWhatsapp(true);
      }

      setEscribiendo(false);

      // Notificar al backend (fire & forget, no bloquea la UI)
      notificarBackend(textoUsuario, intencion?.id ?? 'fallback');
    }, 500);
  };

  const enviarMensaje = (texto?: string) => {
    const contenido = (texto ?? input).trim();
    if (!contenido) return;

    agregarMensaje({ remitente: 'usuario', contenido });
    setInput('');
    responder(contenido);
  };

  // ============================================================
  // BOTÓN CERRADO
  // ============================================================
  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        aria-label="Abrir asistente virtual"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  // ============================================================
  // VENTANA ABIERTA
  // ============================================================
  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96">
      <Card className="overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-3 bg-cyan-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-white" />
            <span className="text-white font-medium text-sm">Asistente Virtual</span>
          </div>
          <button
            onClick={() => setAbierto(false)}
            className="text-white/80 hover:text-white"
            aria-label="Cerrar asistente"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensajes */}
        <div ref={scrollRef} className="h-72 overflow-y-auto p-3 space-y-3">
          {mensajes.map((m) => (
            <div
              key={m.id}
              className={cn(
                'flex gap-2',
                m.remitente === 'usuario' ? 'justify-end' : 'justify-start'
              )}
            >
              {m.remitente === 'bot' && (
                <Bot className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
              )}
              <div
                className={cn(
                  'max-w-[75%] px-3 py-2 rounded-xl text-sm leading-relaxed',
                  m.remitente === 'usuario'
                    ? 'bg-cyan-600 text-white rounded-tr-none'
                    : 'bg-slate-700 text-slate-200 rounded-tl-none'
                )}
              >
                {renderContenido(m.contenido)}
              </div>
              {m.remitente === 'usuario' && (
                <User className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
              )}
            </div>
          ))}

          {escribiendo && (
            <div className="flex gap-2 justify-start">
              <Bot className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
              <div className="bg-slate-700 text-slate-400 px-3 py-2 rounded-xl rounded-tl-none text-sm">
                CoDi está escribiendo…
              </div>
            </div>
          )}
        </div>

        {/* Sugerencias rápidas */}
        {mensajes.length <= 1 && (
          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
            {SUGERENCIAS.map((s) => (
              <button
                key={s}
                onClick={() => enviarMensaje(s)}
                className="text-xs px-2 py-1 rounded-full bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Botón WhatsApp: se libera solo cuando CoDi no tiene respuesta */}
        {mostrarWhatsapp && (
          <div className="px-3 pb-2">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full text-xs py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Hablar con un agente por WhatsApp
            </a>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-slate-700">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviarMensaje();
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí tu pregunta..."
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              aria-label="Enviar"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
