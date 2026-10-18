import Link from 'next/link';

export const metadata = {
  title: 'Manual interno de soporte — Comienzo, anticipo del 30% y marketplace',
};

const secciones = [
  { id: 'comienzo', titulo: '1. Comienzo del servicio' },
  { id: 'anticipo', titulo: '2. Liberación anticipada del 30%' },
  { id: 'resto', titulo: '3. Resto del pago' },
  { id: 'marketplace', titulo: '4. Marketplace y tokens' },
  { id: 'herramientas', titulo: '5. Herramientas del soporte' },
  { id: 'checklist', titulo: '6. Checklist de resolución rápida' },
];

const checklist = [
  {
    caso: 'Inicio no confirmado',
    causas: 'Solo una parte notificó; la otra no entra a su dashboard.',
    accion: 'Contactar a la parte faltante y pedirle que notifique desde "Comienzo del servicio" o "Mis Transacciones". Forzar solo con evidencia.',
    donde: 'Panel admin de inicio del servicio → alerta "una sola notificación >72 h".',
  },
  {
    caso: 'Anticipo no liberado',
    causas: 'Fuera de horario bancario, falta fecha fin estimada, hitos, retención o conformidad ya dada.',
    accion: 'Revisar horario hábil (lun-vie 8-20, sáb 9-13) y los guards. Si todo ok, esperar el próximo tick del cron (cada hora).',
    donde: 'Panel admin de inicio del servicio → "Anticipo pendiente" y estado del cron.',
  },
  {
    caso: 'Token inválido',
    causas: 'Venció y no se renovó, o Mercado Pago rechazó la conexión.',
    accion: 'Pedir al proveedor que reconecte su cuenta desde su panel de Mercado Pago.',
    donde: 'Admin Mercado Pago → alerta "token inválido"; proveedor → semáforo rojo.',
  },
  {
    caso: 'Marketplace deshabilitado',
    causas: 'La cuenta del proveedor no está habilitada para operar con su propio token.',
    accion: 'Habilitar al proveedor (acción administrativa: PATCH /proveedores/:id/mercadopago/activar con { "habilitado": true }, rol SUPER_ADMIN).',
    donde: 'Admin Mercado Pago → columna "Marketplace" de la cuenta.',
  },
  {
    caso: 'Disputa',
    causas: 'Conformidad parcial, reclamo o conflicto sobre el trabajo.',
    accion: 'Derivar a mediación; los fondos quedan retenidos hasta la resolución.',
    donde: '/dashboard/reclamos y /dashboard/mediación.',
  },
];

export default function ManualSoportePage() {
  return (
    <main className="flex-1">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-xs font-semibold tracking-widest text-cyan-400 uppercase mb-2">
          Documento interno · Acceso restringido
        </p>
        <h1 className="text-3xl font-bold text-white">
          Manual de soporte: comienzo notificado, anticipo del 30% y marketplace
        </h1>
        <p className="text-slate-400 mt-3 leading-relaxed">
          Guía operativa del equipo de soporte (super_admin, sistemas, contable,
          comercial y agentes de atención). Todo lo que necesitás para resolver
          consultas del nuevo flujo sin escalar al equipo técnico. Los plazos y
          montos de este manual reflejan la configuración actual de la
          plataforma; siempre confirmá contra el panel admin antes de responder
          al usuario.
        </p>

        <nav className="mt-8 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm font-semibold text-white mb-2">Índice</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
            {secciones.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-cyan-400 hover:text-cyan-300">
                  {s.titulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* ─────────────────────────── 1 ─────────────────────────── */}
        <section id="comienzo" className="mt-12 scroll-mt-24">
          <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-2">
            1. Comienzo del servicio
          </h2>

          <h3 className="text-sm font-semibold text-cyan-300 mt-6 mb-2">
            Qué significa «notificar comienzo del servicio»
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Es la confirmación de cada parte de que el trabajo empezó. El
            cliente o el proveedor lo hace desde su dashboard («Comienzo del
            servicio») o desde «Mis Transacciones», con el pago en custodia. El
            sistema guarda la fecha por separado para cada parte
            (<code className="text-cyan-400">fecha_inicio_servicio_cliente</code>{' '}
            y <code className="text-cyan-400">fecha_inicio_servicio_proveedor</code>);
            cada parte puede notificar una sola vez. La acción envía
            <code className="text-cyan-400"> POST /transacciones/:id/inicio-servicio</code>.
          </p>

          <h3 className="text-sm font-semibold text-cyan-300 mt-6 mb-2">
            Qué es el «inicio efectivo»
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Es la <strong className="text-white">segunda notificación</strong>:
            la más tardía de las dos. Ese momento se guarda en{' '}
            <code className="text-cyan-400">fecha_inicio_servicio_at</code> y es
            el punto desde el que corre el conteo de 72 horas del anticipo. Solo
            cuando llega la segunda notificación, ambas partes reciben la
            confirmación del inicio.
          </p>

          <h3 className="text-sm font-semibold text-cyan-300 mt-6 mb-2">
            Si solo una parte notificó
          </h3>
          <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside">
            <li>
              La parte que notificó quedó registrada; la otra recibió una
              notificación pidiéndole confirmar.
            </li>
            <li>
              Acción del soporte: contactar a la parte faltante y pedirle que
              abra su dashboard y notifique. No forzar sin evidencia.
            </li>
            <li>
              En el panel admin, la alerta «una sola notificación &gt; 72 h»
              marca los casos demorados.
            </li>
            <li>
              El anticipo del 30% <strong className="text-white">no corre</strong>{' '}
              hasta que ambas partes notifiquen.
            </li>
          </ul>

          <h3 className="text-sm font-semibold text-cyan-300 mt-6 mb-2">
            Si hay discrepancias (cliente rechaza, proveedor insiste)
          </h3>
          <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside">
            <li>
              La plataforma no tiene «rechazar el comienzo»: una vez notificado,
              el registro no se borra.
            </li>
            <li>
              Si es solo demora o malentendido: mediar por el canal de la
              transacción y pedir a la parte que no notificó que lo haga si el
              trabajo empezó.
            </li>
            <li>
              Si el conflicto es de fondo (el trabajo no empezó, hay
              reproches): derivar a reclamo/mediación. Los fondos pueden quedar
              retenidos hasta la resolución.
            </li>
            <li>
              No desmentir notificaciones por chat: todo registro relevante debe
              quedar en el ticket interno.
            </li>
          </ul>

          <h3 className="text-sm font-semibold text-cyan-300 mt-6 mb-2">
            Cómo forzar el inicio
          </h3>
          <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside">
            <li>
              <strong className="text-white">Quién:</strong> roles SUPER_ADMIN o
              ADMIN_CONTABLE, desde la transacción (misma acción «Notificar
              comienzo del servicio»; el sistema la resuelve como la parte que
              falta).
            </li>
            <li>
              <strong className="text-white">Condiciones:</strong> pago en
              custodia y que falte exactamente una de las dos notificaciones. Si
              ambas notificaron, el sistema lo rechaza.
            </li>
            <li>
              <strong className="text-white">Evidencia previa requerida:</strong>{' '}
              mensaje de la parte que no notificó confirmando el inicio
              (chat/ticket), foto o evidencia del trabajo comenzado, o
              confirmación de la otra parte. Dejá constancia en el ticket.
            </li>
            <li>
              <strong className="text-white">Registro:</strong> se guardan la
              fecha de la notificación forzada y el flag{' '}
              <code className="text-cyan-400">inicio_servicio_forzado</code> en la
              transacción. El sistema no guarda el motivo: el detalle del porqué
              queda en el ticket interno (número CD-AAAA-XXXXXX).
            </li>
          </ul>

          <h3 className="text-sm font-semibold text-cyan-300 mt-6 mb-2">
            Cómo ver el estado en el panel admin
          </h3>
          <p className="text-sm text-slate-300">
            Ir a <strong className="text-white">Dashboard admin → Inicio del servicio</strong>{' '}
            (<code className="text-cyan-400">/dashboard/admin/inicio-servicio</code>):
            gráfico de donut con «una sola notificación», «ambas confirmaron» y
            «forzadas por admin»; tiempo promedio entre notificaciones; alertas y
            chip de salud (saludable / atención / crítico). Se puede filtrar por
            rango y exportar CSV.
          </p>
        </section>

        {/* ─────────────────────────── 2 ─────────────────────────── */}
        <section id="anticipo" className="mt-12 scroll-mt-24">
          <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-2">
            2. Liberación anticipada del 30%
          </h2>

          <h3 className="text-sm font-semibold text-cyan-300 mt-6 mb-2">
            Cuándo aplica (servicios mayores a 3 días)
          </h3>
          <p className="text-sm text-slate-300 mb-2">
            Aplica cuando se cumplen <strong className="text-white">todas</strong> estas
            condiciones:
          </p>
          <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
            <li>Pago en custodia e inicio efectivo confirmado (dos notificaciones).</li>
            <li>
              Cargada la <strong className="text-white">fecha fin estimada</strong> del
              servicio, y que sea posterior a inicio + 72 h (ese es el criterio
              real de «servicio de más de 3 días»).
            </li>
            <li>Sin hitos (los servicios por hitos están excluidos del anticipo).</li>
            <li>Sin fondos retenidos, sin conformidad y sin liberación previa.</li>
          </ul>
          <p className="text-sm text-slate-400 mt-2">
            Si la transacción no tiene fecha fin estimada, el anticipo nunca se
            dispara: ese es el error más frecuente.
          </p>

          <h3 className="text-sm font-semibold text-cyan-300 mt-6 mb-2">
            Cómo se calcula
          </h3>
          <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
            <li>
              Pasan <strong className="text-white">72 horas calendario</strong> desde{' '}
              <code className="text-cyan-400">fecha_inicio_servicio_at</code>.
            </li>
            <li>
              Un cron (cada hora) lo ejecuta <strong className="text-white">solo en
              horario bancario hábil</strong>: lunes a viernes 08:00–20:00, sábados
              09:00–13:00 (hora Argentina); domingos y feriados cerrado. Si venció
              un feriado, se libera el siguiente hábil.
            </li>
            <li>
              Monto: bruto = 30% del monto acordado; comisión (8% por defecto)
              calculada sobre ese 30%; al proveedor le llega el neto. Ejemplo:
              $10.000 → bruto $3.000 → comisión $240 → neto $2.760.
            </li>
            <li>
              Es único: queda marcado con{' '}
              <code className="text-cyan-400">fecha_liberacion_anticipada_at</code> y
              no se repite nunca.
            </li>
          </ul>

          <h3 className="text-sm font-semibold text-cyan-300 mt-6 mb-2">
            Qué hacer si el anticipo no se liberó
          </h3>
          <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
            <li>¿Ya pasaron 72 horas calendario desde el inicio efectivo?</li>
            <li>¿Estamos en horario bancario hábil? (fuera de él, esperar)</li>
            <li>¿Tiene fecha fin estimada posterior a inicio + 72 h?</li>
            <li>¿Tiene hitos? (si sí, no aplica)</li>
            <li>¿Fondos retenidos o conformidad ya dada? (si sí, no aplica)</li>
            <li>
              Revisar en el panel admin: «anticipo pendiente», alerta
              «demorados por horario» y el estado del cron (última/próxima
              ejecución).
            </li>
          </ol>

          <h3 className="text-sm font-semibold text-cyan-300 mt-6 mb-2">
            Si se liberó pero el proveedor no lo ve
          </h3>
          <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
            <li>
              Verificar en la transacción{' '}
              <code className="text-cyan-400">fecha_liberacion_anticipada_at</code> y{' '}
              <code className="text-cyan-400">monto_liberado</code>.
            </li>
            <li>
              El proveedor ve el <strong className="text-white">neto</strong> (bruto
              menos comisión): una diferencia del 8% sobre el 30% es esperable,
              no un error.
            </li>
            <li>
              Ambas partes reciben la notificación «pago liberado» con el detalle;
              si el usuario dice que no llegó, revisar su bandeja de
              notificaciones de la plataforma.
            </li>
            <li>
              Si corresponde y no se liberó (caso excepcional ya resuelto por
              soporte), la liberación manual es:{' '}
              <code className="text-cyan-400">POST /pagos/transacciones/:id/liberar</code>{' '}
              (SUPER_ADMIN / ADMIN_CONTABLE).
            </li>
          </ul>

          <h3 className="text-sm font-semibold text-cyan-300 mt-6 mb-2">
            Cómo verificar en el panel admin y en la transacción
          </h3>
          <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
            <li>
              Panel admin de inicio del servicio: anticipo liberados / pendientes
              / no aplicables, montos bruto y neto, «descontado en liberaciones
              finales» y estado del cron.
            </li>
            <li>
              En la transacción: fecha del inicio efectivo,{' '}
              <code className="text-cyan-400">fecha_liberacion_anticipada_at</code>{' '}
              (vacía = aún no liberado) y monto acumulado en{' '}
              <code className="text-cyan-400">monto_liberado</code>.
            </li>
          </ul>
        </section>

        {/* ─────────────────────────── 3 ─────────────────────────── */}
        <section id="resto" className="mt-12 scroll-mt-24">
          <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-2">
            3. Resto del pago
          </h2>

          <h3 className="text-sm font-semibold text-cyan-300 mt-6 mb-2">
            Conformidad manual (24 horas hábiles)
          </h3>
          <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
            <li>
              El proveedor marca «Marcar servicio completado» → el cliente tiene{' '}
              <strong className="text-white">72 horas hábiles</strong> para dar
              conformidad.
            </li>
            <li>
              El cliente confirma con un porcentaje (1–100). La liberación final
              se programa a <strong className="text-white">+24 horas hábiles</strong>.
            </li>
            <li>
              Porcentaje &lt; 100 → la transacción pasa a{' '}
              <strong className="text-white">disputa</strong> y los fondos quedan
              retenidos (el porcentaje no conforme queda retenido).
            </li>
          </ul>

          <h3 className="text-sm font-semibold text-cyan-300 mt-6 mb-2">
            Conformidad automática (72 horas hábiles)
          </h3>
          <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
            <li>
              Si el cliente no responde en 72 horas hábiles, el sistema da
              conformidad 100% automática y programa la liberación a +24 horas
              hábiles.
            </li>
            <li>
              El cliente recibe el aviso; si el trabajo estaba mal, su ventana ya
              cerró — por eso conviene pedirle que responda a tiempo.
            </li>
          </ul>

          <h3 className="text-sm font-semibold text-cyan-300 mt-6 mb-2">
            Descuento del anticipo (evita sobre-liberación)
          </h3>
          <p className="text-sm text-slate-300">
            Al liberar el resto se resta lo ya anticipado:{' '}
            <strong className="text-white">bruto final = total − 30% ya liberado</strong>.
            Ejemplo con $10.000 y anticipo ya pagado: la liberación final libera
            sobre $7.000 (no sobre $10.000). Nunca se libera más del 100% del
            monto acordado. En el panel admin esto aparece como «descontado en
            liberaciones finales».
          </p>

          <h3 className="text-sm font-semibold text-cyan-300 mt-6 mb-2">
            Casos especiales
          </h3>
          <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
            <li>
              <strong className="text-white">Hitos:</strong> obligatorios cuando la
              duración estimada supera 7 días hábiles. Con hitos no hay anticipo
              del 30%, la conformidad es hito por hito y cada hito se conforma
              (automático a las 48 h hábiles) y libera por separado.
            </li>
            <li>
              <strong className="text-white">Retenciones:</strong> fondos retenidos
              por conformidad parcial, reclamo o resolución. Se liberan con la
              resolución del reclamo o con liberación manual del admin; si el
              reclamo termina en reembolso, se devuelve al medio de pago.
            </li>
            <li>
              <strong className="text-white">Disputas:</strong> de disputa la
              transacción puede terminar completada, reembolsada o cancelada;
              siempre derivar a mediación.
            </li>
          </ul>
        </section>

        {/* ─────────────────────────── 4 ─────────────────────────── */}
        <section id="marketplace" className="mt-12 scroll-mt-24">
          <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-2">
            4. Marketplace y tokens
          </h2>

          <h3 className="text-sm font-semibold text-cyan-300 mt-6 mb-2">
            Qué es el modo marketplace
          </h3>
          <p className="text-sm text-slate-300">
            Es operar con la cuenta de Mercado Pago del <em>proveedor</em> (vía
            conexión OAuth) para retener y capturar los pagos, en lugar de usar
            la cuenta de la plataforma. Depende de dos cosas: el interruptor
            global de la plataforma (<code className="text-cyan-400">MP_MARKETPLACE_ENABLED</code>){' '}
            y la habilitación de cada proveedor. El checkout siempre lo crea la
            plataforma; la diferencia está en quién retiene/captura.
          </p>

          <h3 className="text-sm font-semibold text-cyan-300 mt-6 mb-2">
            Token válido / inválido
          </h3>
          <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
            <li>
              <strong className="text-white">Válido:</strong> la cuenta del proveedor
              está conectada y su token opera con normalidad.
            </li>
            <li>
              <strong className="text-white">Inválido:</strong> el sistema dejó de
              usar el token del proveedor y hace <em>fallback</em> a la cuenta de
              la plataforma (las operaciones siguen, pero con la cuenta
              equivocada para el proveedor). El motivo se ve en «último error»:
              token vencido sin renovar, sin refresh token, o rechazo de
              Mercado Pago.
            </li>
            <li>
              Un monitor lo revisa cada 30 minutos y la renovación automática
              corre cada 12 horas (anticipa vencimientos de las próximas 24 h).
            </li>
          </ul>

          <h3 className="text-sm font-semibold text-cyan-300 mt-6 mb-2">
            Cómo reconectar Mercado Pago
          </h3>
          <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
            <li>
              Pedir al proveedor que entre a su panel{' '}
              <strong className="text-white">Dashboard → Mercado Pago</strong>.
            </li>
            <li>
              Botón «Reconectar con Mercado Pago» (o «Conectar» si nunca lo hizo):
              abre la autorización de Mercado Pago y vuelve al callback.
            </li>
            <li>
              Verificar semáforo: verde = ok; rojo = token inválido; amarillo =
              marketplace deshabilitado; gris = sin conexión.
            </li>
            <li>
              El estado fino (conectado, vencimiento del token, último error)
              está en <code className="text-cyan-400">GET /proveedores/:id/mercadopago/estado</code>.
            </li>
          </ol>

          <h3 className="text-sm font-semibold text-cyan-300 mt-6 mb-2">
            Qué hacer si el proveedor no puede cobrar
          </h3>
          <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
            <li>¿Está conectado? Si no o si hay error → reconectar.</li>
            <li>¿Marketplace habilitado para esa cuenta? (panel admin, columna Marketplace)</li>
            <li>
              Si el token está caído, las operaciones siguen con la cuenta de la
              plataforma (fallback): el cobro no se pierde, pero conviene
              reconectar.
            </li>
            <li>Revisar alertas y fallas de captura en el panel admin de MP.</li>
          </ol>

          <h3 className="text-sm font-semibold text-cyan-300 mt-6 mb-2">
            Cómo interpretar las alertas del panel admin
          </h3>
          <p className="text-sm text-slate-300">
            En <strong className="text-white">Dashboard admin → Mercado Pago</strong>:
          </p>
          <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
            <li>
              <strong className="text-white">Token inválido</strong> (crítica): la
              conexión fue rechazada → reconectar.
            </li>
            <li>
              <strong className="text-white">Sin refresh token</strong>: no se podrá
              renovar al vencer → reconectar.
            </li>
            <li>
              <strong className="text-white">Habilitado con token roto</strong>{' '}
              (crítica): habilitada con marketplace pero el token no sirve →
              reconectar.
            </li>
            <li>
              <strong className="text-white">Captura demorada / operación fallida</strong>:
              revisar la operación puntual.
            </li>
            <li>
              KPIs útiles: cuentas conectadas, habilitadas en marketplace y con
              token inválido.
            </li>
          </ul>

          <h3 className="text-sm font-semibold text-cyan-300 mt-6 mb-2">
            Si el token está vencido
          </h3>
          <p className="text-sm text-slate-300">
            La renovación es automática. Si venció y no se renovó a tiempo, el
            monitor lo marca inválido y aparece la alerta: la solución es que el
            proveedor reconecte (paso anterior). No hay que «regenerar» tokens a
            mano ni pedir credenciales: nunca se piden ni se muestran tokens en
            la plataforma.
          </p>
        </section>

        {/* ─────────────────────────── 5 ─────────────────────────── */}
        <section id="herramientas" className="mt-12 scroll-mt-24">
          <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-2">
            5. Herramientas del soporte
          </h2>
          <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside">
            <li>
              <strong className="text-white">Panel admin de inicio del servicio</strong>{' '}
              (<code className="text-cyan-400">/dashboard/admin/inicio-servicio</code>): notificaciones,
              forzados, anticipo, cron, alertas, salud y exportación CSV.
            </li>
            <li>
              <strong className="text-white">Panel admin de Mercado Pago</strong> —
              métricas y alertas de marketplace/tokens{' '}
              (<code className="text-cyan-400">/dashboard/admin/mercado-pago</code>).
              (El área de <em>Dashboard admin → Métricas</em> corresponde al
              seguimiento de SLA y objetivos, no a Mercado Pago.)
            </li>
            <li>
              <strong className="text-white">Panel del proveedor</strong>{' '}
              (<code className="text-cyan-400">/dashboard/inicio-servicio</code>): su vista
              de notificación, anticipo y montos; y{' '}
              <code className="text-cyan-400">/dashboard/mercado-pago</code> para la
              conexión con Mercado Pago.
            </li>
            <li>
              <strong className="text-white">Centro de ayuda</strong>{' '}
              (<code className="text-cyan-400">/ayuda</code>): guía pública del comienzo
              del servicio, novedades del anticipo y FAQ — material apto para
              enviar al usuario.
            </li>
            <li>
              <strong className="text-white">Logs relevantes (sin secretos):</strong>{' '}
              el cron de custodia (corre cada hora), el monitor de tokens de MP
              (cada 30 minutos) y los avisos de fallback de token. Son aptos para
              compartir en tickets: nunca contienen access_token ni
              client_secret, y <strong className="text-white">tampoco deben pedirse</strong>{' '}
              al usuario. Las alertas de nivel crítico también llegan por email
              al buzón interno de alertas.
            </li>
            <li>
              <strong className="text-white">Cómo abrir un ticket interno:</strong>{' '}
              Dashboard → Tickets → «Nuevo ticket» (nivel, canal formulario). El
              sistema asigna un número de seguimiento con formato{' '}
              <code className="text-cyan-400">CD-AAAA-XXXXXX</code>. Adjuntá siempre
              el ID de transacción (UUID), fechas y el rol de las partes.
            </li>
          </ul>
        </section>

        {/* ─────────────────────────── 6 ─────────────────────────── */}
        <section id="checklist" className="mt-12 scroll-mt-24">
          <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-2">
            6. Checklist de resolución rápida
          </h2>
          <div className="mt-4 space-y-3">
            {checklist.map((c) => (
              <div
                key={c.caso}
                className="rounded-xl border border-slate-700 bg-slate-800/50 p-4"
              >
                <p className="font-semibold text-white text-sm">{c.caso}</p>
                <p className="text-sm text-slate-400 mt-1">
                  <span className="text-slate-300">Causa probable:</span> {c.causas}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  <span className="text-cyan-300">Acción:</span> {c.accion}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  <span className="text-slate-300">Dónde verificar:</span> {c.donde}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12 rounded-xl border border-slate-700 bg-slate-800/40 p-4 text-sm text-slate-400">
          Documento interno. Si algo de esta guía no coincide con lo que ves en
          los paneles, reportarlo al equipo técnico con el número de ticket y el
          ID de la transacción.{' '}
          <Link href="/ayuda" className="text-cyan-400 hover:text-cyan-300">
            Volver al centro de ayuda
          </Link>
        </div>
      </div>
    </main>
  );
}
