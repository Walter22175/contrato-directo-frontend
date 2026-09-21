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
  contestacion?: ContestacionReclamo;
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
