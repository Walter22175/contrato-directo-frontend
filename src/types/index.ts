export interface Usuario {
  id_usuario: string;
  email: string;
  nombre: string;
  apellido?: string;
  tipo_persona: 'fisica' | 'juridica';
  cuit_cuil?: string;
  dni?: string;
  telefono?: string;
  direccion?: string;
  estado: 'activo' | 'suspendido' | 'cancelado' | 'pendiente';
  email_verificado: boolean;
  fecha_registro: string;
  usuario_roles?: UsuarioRol[];
}

export interface UsuarioRol {
  id_usuario_rol: number;
  id_usuario: string;
  id_rol: number;
  activo: boolean;
  rol: Rol;
}

export interface Rol {
  id_rol: number;
  nombre: string;
  descripcion?: string;
}

export interface AuthResponse {
  usuario: Partial<Usuario>;
  access_token: string;
  refresh_token: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  tipo_persona: 'fisica' | 'juridica';
  cuit_cuil?: string;
  dni?: string;
  telefono?: string;
  direccion?: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  nuevaPassword: string;
}

export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion?: string;
  icono_url?: string;
  activa: boolean;
  orden: number;
  servicios?: Servicio[];
}

export interface Servicio {
  id_servicio: number;
  id_categoria: number;
  nombre: string;
  descripcion?: string;
  palabras_clave?: string[];
  activo: boolean;
  categoria?: Categoria;
  servicios_proveedor?: ServicioProveedor[];
}

export interface ServicioProveedor {
  id_servicio_proveedor: number;
  id_usuario: string;
  id_servicio: number;
  precio_estimado?: number;
  moneda: string;
  descripcion_personalizada?: string;
  disponible: boolean;
  servicio?: Servicio;
  proveedor?: Partial<Usuario>;
}

export interface PerfilProveedor {
  id_perfil_proveedor: number;
  id_usuario: string;
  rubro_principal?: string;
  descripcion?: string;
  sitio_web?: string;
  sello_verificado: boolean;
  calificacion_promedio?: number;
  cantidad_valoraciones: number;
  proveedor_destacado: boolean;
  tasa_respuesta?: number;
  tasa_cumplimiento?: number;
  antiguedad_meses: number;
}

export interface Transaccion {
  id_transaccion: string;
  id_cliente: string;
  id_proveedor: string;
  id_servicio: number;
  descripcion?: string;
  monto_acordado: number;
  moneda: string;
  comision_porcentaje: number;
  comision_monto: number;
  estado: string;
  tipo_transaccion: 'servicio' | 'producto';
  fecha_creacion: string;
  cliente?: Partial<Usuario>;
  proveedor?: Partial<Usuario>;
  servicio?: Servicio;
}

export interface Contrato {
  id_contrato: string;
  id_transaccion: string;
  tipo_contrato: string;
  incluye_iva: boolean;
  url_pdf_borrador?: string;
  url_pdf_firmado?: string;
  estado: 'borrador' | 'pendiente_firma' | 'firmado' | 'cancelado';
  fecha_generacion: string;
  fecha_firma_cliente?: string;
  fecha_firma_proveedor?: string;
  transaccion?: Transaccion;
}

export interface Valoracion {
  id_valoracion: number;
  id_transaccion: string;
  id_evaluador: string;
  id_evaluado: string;
  tipo_evaluador: 'cliente' | 'proveedor';
  puntuacion: number;
  comentario?: string;
  fecha_valoracion: string;
  estado: string;
}

export interface Reclamo {
  id_reclamo: string;
  id_transaccion: string;
  id_reclamante: string;
  id_reclamado: string;
  tipo_reclamo: string;
  descripcion: string;
  fecha_incidente: string;
  estado: string;
  fecha_apertura: string;
  fecha_cierre?: string;
  fecha_limite_contestacion?: string;
  fecha_limite_apelacion?: string;
  reclamante?: Partial<Usuario>;
  reclamado?: Partial<Usuario>;
  transaccion?: Transaccion;
  contestaciones?: ContestacionReclamo[];
  mediacion?: Mediacion;
  documentos?: DocumentoReclamo[];
}

export interface ContestacionReclamo {
  id_contestacion: number;
  id_reclamo: string;
  id_contestante: string;
  descripcion: string;
  fecha_contestacion: string;
  prorroga_solicitada: boolean;
  contestante?: Partial<Usuario>;
}

export interface DocumentoReclamo {
  id_documento: number;
  id_reclamo: string;
  nombre_archivo: string;
  url_archivo: string;
  tipo_archivo?: string;
  tamano_bytes: number;
  fecha_subida: string;
}

export interface Mediacion {
  id_mediacion: string;
  id_reclamo: string;
  id_mediador?: string;
  estado: string;
  fecha_asignacion: string;
  fecha_resolucion?: string;
  audiencia_virtual: boolean;
  fecha_audiencia?: string;
  duracion_audiencia_minutos?: number;
  acta_audiencia_url?: string;
  fecha_limite_resolucion?: string;
  prorroga_solicitada: boolean;
  mediacion_voluntaria_ofrecida: boolean;
  reclamo?: Reclamo;
  mediador?: Partial<Usuario>;
  resolucion?: ResolucionMediacion;
  sanciones?: Sancion[];
}

export interface ResolucionMediacion {
  id_resolucion: number;
  id_mediacion: string;
  tipo_resolucion: string;
  fundamentos: string;
  plazo_cumplimiento_dias: number;
  fecha_emision: string;
  estado: string;
  apelaciones?: ApelacionMediacion[];
}

export interface ApelacionMediacion {
  id_apelacion: number;
  id_resolucion: number;
  id_apelante: string;
  motivo: string;
  estado: string;
  id_mediador_supervisor?: string;
  fecha_apelacion: string;
  fecha_resolucion?: string;
  resolucion_final?: string;
  apelante?: Partial<Usuario>;
  mediador_supervisor?: Partial<Usuario>;
}

export interface Sancion {
  id_sancion: number;
  id_usuario: string;
  id_mediacion?: string;
  tipo_sancion: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin?: string;
  activa: boolean;
  id_aplicador: string;
  usuario?: Partial<Usuario>;
  aplicador?: Partial<Usuario>;
}

export interface Reembolso {
  id_reembolso: number;
  id_transaccion: string;
  id_solicitante: string;
  monto_solicitado: number;
  monto_aprobado?: number;
  motivo: string;
  estado: string;
  fecha_solicitud: string;
  fecha_resolucion?: string;
  id_resolutor?: string;
}

export interface Ticket {
  id_ticket: string;
  id_usuario: string;
  asunto: string;
  descripcion: string;
  nivel: string;
  canal: string;
  estado: string;
  prioridad: string;
  fecha_creacion: string;
}

export interface Faq {
  id_faq: number;
  categoria: string;
  pregunta: string;
  respuesta: string;
  orden: number;
  activo: boolean;
  veces_consultado: number;
}

export interface Notificacion {
  id_notificacion: string;
  id_usuario: string;
  tipo: string;
  evento: string;
  titulo: string;
  mensaje: string;
  canal: string;
  leida: boolean;
  fecha_envio: string;
  fecha_lectura?: string;
}

export interface PreferenciaNotificacion {
  id_preferencia: string;
  id_usuario: string;
  tipo_notificacion: string;
  canal_preferido: string;
  habilitada: boolean;
  frecuencia_resumen: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface CreateReclamoDto {
  id_transaccion: string;
  id_reclamante: string;
  id_reclamado: string;
  tipo_reclamo: string;
  descripcion: string;
  fecha_incidente: string;
}

export interface ContestarReclamoDto {
  id_contestatario: string;
  respuesta: string;
}

export interface IniciarMediacionDto {
  id_mediador: string;
  audiencia_virtual?: boolean;
  fecha_audiencia?: string;
}

export interface ResolverMediacionDto {
  tipo_resolucion: string;
  fundamentos?: string;
  detalle?: string;
  acta_audiencia_url?: string;
  plazo_cumplimiento_dias?: number;
}

export interface AgregarDocumentoDto {
  nombre_archivo: string;
  url_archivo: string;
  tipo_archivo?: string;
  tamano_bytes: number;
}

export interface AsignarMediadorDto {
  id_mediador: string;
}

export interface ConvocarAudienciaDto {
  fecha_audiencia: string;
  audiencia_virtual?: boolean;
  duracion_audiencia_minutos?: number;
}

export interface CrearApelacionDto {
  id_resolucion: number;
  id_apelante: string;
  motivo: string;
}

export interface ResolverApelacionDto {
  id_mediador_supervisor: string;
  resolucion_final: string;
}

export interface CrearSancionDto {
  id_usuario: string;
  id_mediacion?: string;
  tipo_sancion: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin?: string;
}

export type SlaNivel = 'nivel_1' | 'nivel_2' | 'nivel_3' | 'nivel_4' | 'nivel_5';

export type SlaCanal = 'whatsapp' | 'email' | 'telefono' | 'centro_ayuda' | 'redes_sociales' | 'formulario';

export interface SlaConfig {
  nivel: SlaNivel;
  nombre: string;
  descripcion: string;
  tiempo_primera_respuesta_min: number;
  tiempo_resolucion_min: number;
  canales_recomendados: SlaCanal[];
}

export interface SlaTracking {
  id_ticket: string;
  nivel: SlaNivel;
  canal: SlaCanal;
  fecha_creacion: string;
  fecha_primera_respuesta?: string;
  fecha_resolucion?: string;
  estado_sla: 'cumplido' | 'en_riesgo' | 'vencido' | 'pendiente';
  tiempo_limite_primera_respuesta: string;
  tiempo_limite_resolucion: string;
}

export interface HorarioAtencion {
  id_horario: number;
  nombre: string;
  dia_semana: number[];
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

export interface Feriado {
  id_feriado: number;
  fecha: string;
  nombre: string;
  nacional: boolean;
}

export interface MetricaAtencion {
  periodo: string;
  tpr_whatsapp_min: number;
  tpr_email_min: number;
  tr_whatsapp_min: number;
  tr_email_min: number;
  csat: number;
  nps: number;
  fcr_porcentaje: number;
  uso_centro_ayuda_porcentaje: number;
  derivacion_chatbot_porcentaje: number;
  espera_telefono_min: number;
  tickets_por_agente_simple: number;
  tickets_por_agente_complejo: number;
}

export interface MetricaAgente {
  id_agente: string;
  nombre: string;
  email: string;
  tickets_resueltos: number;
  tiempo_promedio_respuesta_min: number;
  tiempo_promedio_resolucion_min: number;
  csat_promedio: number;
  activo: boolean;
}

export interface EncuestaSatisfaccion {
  id_encuesta: number;
  id_ticket: string;
  id_usuario: string;
  puntuacion: number;
  comentario?: string;
  fecha_encuesta: string;
  tipo: 'post_ticket' | 'post_reclamo' | 'post_mediacion';
}

export interface ChatbotMensaje {
  id_mensaje: number;
  sessionId: string;
  remitente: 'usuario' | 'bot';
  contenido: string;
  fecha: string;
}

export interface FeedbackAyuda {
  id_feedback: number;
  id_faq: number;
  id_usuario: string;
  util: boolean;
  comentario?: string;
  fecha: string;
}

export interface ReporteTrimestral {
  id_reporte: number;
  periodo: string;
  fecha_generacion: string;
  metricas: MetricaAtencion;
  temas_frecuentes: { tema: string; cantidad: number }[];
  areas_mejora: string[];
}

export interface AgenteSoporte {
  id_agente: string;
  id_usuario: string;
  nivel: number;
  especialidades: string[];
  tickets_asignados: number;
  max_tickets: number;
  activo: boolean;
  usuario?: Partial<Usuario>;
}

export interface AsignacionTicket {
  id_asignacion: number;
  id_ticket: string;
  id_agente: string;
  fecha_asignacion: string;
  agente?: AgenteSoporte;
}

export interface Escalamiento {
  id_escalamiento: number;
  id_ticket: string;
  nivel_anterior: SlaNivel;
  nivel_nuevo: SlaNivel;
  motivo: string;
  fecha: string;
  id_agente_origen?: string;
  id_agente_destino?: string;
}
