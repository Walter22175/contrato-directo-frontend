const DIR_CATEGORIAS = '/icons/categorías';
const DIR_SERVICIOS = '/icons/servicios';

export const ICONOS_CATEGORIAS: Record<string, string> = {
  'Mantenimiento y Reparaciones Domiciliarias': `${DIR_CATEGORIAS}/mantenimiento.svg`,
  'Automóviles': `${DIR_CATEGORIAS}/automovil.svg`,
  'Mascotas': `${DIR_CATEGORIAS}/mascota.svg`,
  'Tecnología': `${DIR_CATEGORIAS}/tecnologia.svg`,
  'Community Manager': `${DIR_CATEGORIAS}/conmunity_manager.svg`,
  'Software': `${DIR_CATEGORIAS}/software.svg`,
  'Paisajismo': `${DIR_CATEGORIAS}/paisajismo.svg`,
};

export const ICONOS_SERVICIOS: Record<string, string> = {
  // Mantenimiento y Reparaciones Domiciliarias
  'Plomería': `${DIR_SERVICIOS}/mantenimiento/plomeria.svg`,
  'Electricidad': `${DIR_SERVICIOS}/mantenimiento/electricidad.svg`,
  'Pintura': `${DIR_SERVICIOS}/mantenimiento/pintura.svg`,
  'Cerrajería': `${DIR_SERVICIOS}/mantenimiento/cerrajero.svg`,
  'Carpintería': `${DIR_SERVICIOS}/mantenimiento/carpintero.svg`,
  'Gas': `${DIR_SERVICIOS}/mantenimiento/gasista.svg`,
  'Steel Frame': `${DIR_SERVICIOS}/mantenimiento/steel_frame.svg`,
  'Sanitarios': `${DIR_SERVICIOS}/mantenimiento/sanitarios.svg`,
  'Vidriería': `${DIR_SERVICIOS}/mantenimiento/vidrieria.svg`,
  'Herrería': `${DIR_SERVICIOS}/mantenimiento/herreria.svg`,
  'Pozos Artesanales': `${DIR_SERVICIOS}/mantenimiento/pozos_artesanales.svg`,
  'Pozo Artesanal': `${DIR_SERVICIOS}/mantenimiento/pozos_artesanales.svg`,
  // Automóviles
  'Mecánica General': `${DIR_SERVICIOS}/automoviles/mecanica_general.svg`,
  'Electricidad del Automotor': `${DIR_SERVICIOS}/automoviles/electricista_auto.svg`,
  'Chapa y Pintura': `${DIR_SERVICIOS}/automoviles/chapa_pintura.svg`,
  'Service y Mantenimiento': `${DIR_SERVICIOS}/automoviles/lubricentro.svg`,
  'Gomería': `${DIR_SERVICIOS}/automoviles/gomería.svg`,
  'Cerrajería Automotor': `${DIR_SERVICIOS}/automoviles/cerajeria_automotor.svg`,
  // Mascotas
  'Veterinaria': `${DIR_SERVICIOS}/mascotas/veterinaria.svg`,
  'Peluquería Canina': `${DIR_SERVICIOS}/mascotas/peluqueria_canina.svg`,
  'Peluquería Felina': `${DIR_SERVICIOS}/mascotas/peluqueria_felina.svg`,
  'Adiestramiento': `${DIR_SERVICIOS}/mascotas/adiestraminto.svg`,
  'Pet Sister': `${DIR_SERVICIOS}/mascotas/pet_sister.svg`,
  'Paseos': `${DIR_SERVICIOS}/mascotas/paseo.svg`,
  // Tecnología
  'Reparación de PCs': `${DIR_SERVICIOS}/tecnologia/reparación_de_pcs.svg`,
  'Reparación de Celulares': `${DIR_SERVICIOS}/tecnologia/reparacion_de_celulares.svg`,
  'Reparación de Impresoras': `${DIR_SERVICIOS}/tecnologia/reparacion_de_impresoras.svg`,
  'Soporte Técnico': `${DIR_SERVICIOS}/tecnologia/soporte_tecnico.svg`,
  'Redes e Internet': `${DIR_SERVICIOS}/tecnologia/redes_e_iternet.svg`,
  'Recuperación de Datos': `${DIR_SERVICIOS}/tecnologia/recuperacion_de_datos.svg`,
  // Community Manager
  'Gestión de Redes': `${DIR_SERVICIOS}/conmunity_manager/gestion_de_redes.svg`,
  'Creación de Contenido': `${DIR_SERVICIOS}/conmunity_manager/creacion_de_contenido.svg`,
  'Pauta Publicitaria': `${DIR_SERVICIOS}/conmunity_manager/pauta_publicitaria.svg`,
  'Atención al Cliente': `${DIR_SERVICIOS}/conmunity_manager/atencion_al_cliente.svg`,
  'Analytics e Informes': `${DIR_SERVICIOS}/conmunity_manager/analisis_e_informes.svg`,
  'Estrategia Digital': `${DIR_SERVICIOS}/conmunity_manager/estrategia_digital.svg`,
  // Software
  'Diseño y Desarrollo Web': `${DIR_SERVICIOS}/software/desarrollo_y_diseño_web.svg`,
  'Apps Móviles': `${DIR_SERVICIOS}/software/app_movil.svg`,
  'Gestión de Sistemas': `${DIR_SERVICIOS}/software/gestion_de_sistemas.svg`,
  'Ciberseguridad': `${DIR_SERVICIOS}/software/ciber_sguridad.svg`,
  'Cloud Computing': `${DIR_SERVICIOS}/software/cloud_computing.svg`,
  'Mantenimiento de Software': `${DIR_SERVICIOS}/software/mantenimiento _de_software.svg`,
  // Paisajismo
  'Diseño de Jardines': `${DIR_SERVICIOS}/paisajismo/diseño_de_jardines.svg`,
  'Paisajismo Residencial': `${DIR_SERVICIOS}/paisajismo/paisajismo_residencial.svg`,
  'Paisajismo Comercial': `${DIR_SERVICIOS}/paisajismo/paisajismo_comercial.svg`,
  'Sistema de Riego': `${DIR_SERVICIOS}/paisajismo/sistema_de_riego.svg`,
  'Poda y Mantenimiento': `${DIR_SERVICIOS}/paisajismo/poda_y_mantenimiento.svg`,
  'Instalación de Césped': `${DIR_SERVICIOS}/paisajismo/instalacion_de_cesped.svg`,
  'Iluminación Paisajística': `${DIR_SERVICIOS}/paisajismo/iluminacion_paisajistica.svg`,
  'Decoración con Plantas': `${DIR_SERVICIOS}/paisajismo/decoracion_con_plantas.svg`,
  'Remodelación de Espacios Verdes': `${DIR_SERVICIOS}/paisajismo/remodelacion_de_espacios_verdes.svg`,
  'Limpieza y Mantenimiento de Piscinas': `${DIR_SERVICIOS}/paisajismo/limpieza_y_mantenimiento_piscina.svg`,
};

const normalizar = (valor: string): string =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const indicePorNombre = (mapa: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(mapa).map(([nombre, ruta]) => [normalizar(nombre), ruta]));

const categoriasPorNombre = indicePorNombre(ICONOS_CATEGORIAS);
const serviciosPorNombre = indicePorNombre(ICONOS_SERVICIOS);

export function iconoCategoria(nombre?: string | null): string | undefined {
  if (!nombre) return undefined;
  return categoriasPorNombre[normalizar(nombre)];
}

export function iconoServicio(
  nombre?: string | null,
  categoria?: string | null,
): string | undefined {
  if (nombre) {
    const ruta = serviciosPorNombre[normalizar(nombre)];
    if (ruta) return ruta;
  }
  return iconoCategoria(categoria);
}
