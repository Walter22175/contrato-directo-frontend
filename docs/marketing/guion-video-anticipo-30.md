# Guion de video explicativo — Anticipo del 30% (45 s)

Video corto para Instagram, YouTube, Stories/Reels y WhatsApp Business.
Landing de referencia: `/novedades/anticipo-30`.

## Guion con storyboard alineado

| Tiempo | Voz en off | Escena / Visual | Texto en pantalla |
|---|---|---|---|
| 0–5s | "Presentamos el nuevo anticipo del 30% para servicios largos." | **1** — Apertura: animación de dos personas (cliente y proveedor) entrando al dashboard | `Nuevo anticipo del 30% para servicios largos` |
| 5–12s | "Cliente y proveedor confirman el comienzo del trabajo desde la plataforma." | **1** — Ambas tocan "Notificar comienzo"; aparecen dos checks ✔ | `Cliente + Proveedor confirman` |
| 12–18s | "El inicio efectivo es la segunda notificación." | **1→2** — El segundo check enciende un reloj (transición) | `Inicio efectivo = 2.ª notificación` |
| 18–25s | "Pasadas 72 horas calendario, se libera automáticamente el 30% en horario bancario hábil." | **2** — Reloj girando "72 h" → **3** — Icono de banco con sticker "Horario hábil" (lun–vie 8–20) | `72 h calendario → horario hábil` |
| 25–35s | "El resto del pago sigue retenido hasta la conformidad del cliente." | **4** — Barra de progreso: 30% se libera en verde, 70% retenido en gris → **5** — Dashboard del proveedor mostrando el anticipo acreditado | `30% liberado · resto hasta la conformidad` |
| 35–45s | "Más seguridad, más transparencia, mejor flujo de trabajo." | **6** — CTA final con logo y link | `Conocé más → contrato-directo.com/novedades/anticipo-30` |

## Detalle de escenas

- **Escena 1 — Doble confirmación:** dos avatares estilizados, cada uno pulsa "Notificar comienzo del servicio" en su teléfono/dashboard; al sincronizarse, aparecen dos checks y un destello. Estilo flat/corporativo, paleta cyan del sitio.
- **Escena 2 — Reloj 72 h:** reloj analógico acelerado con contador `0h → 72h`; al llegar, el 30% de un monto abstracto se separa en un chip.
- **Escena 3 — Banco horario hábil:** icono de edificio bancario con sticker "Horario hábil" y calendario lun–vie marcado (sáb 9–13 opcional). Transmite que el pago no depende del fin de semana.
- **Escena 4 — Barra 30/70:** barra de progreso animada; 30% pasa a verde "Liberado", 70% queda gris "Retenido hasta la conformidad".
- **Escena 5 — Dashboard del proveedor:** captura o mock del panel real con el chip del anticipo y el monto neto; genera confianza (es el producto real).
- **Escena 6 — CTA:** logo + `Conocé más` + URL, 3 s de hold para que se lea.

## Producción

- **Voz en off:** neutra, ritmo pausado (~2,8 palabras/s), sin música que compita con la voz.
- **Música:** background corporativo suave, sube en el CTA final.
- **Subtítulos:** siempre quemados (Instagram/WhatsApp se ven sin sonido).
- **Animación de datos:** usar montos de ejemplo redondos ($10.000 → $3.000).
- **Dominio del link:** verificar contra `FRONTEND_URL` de producción (`https://contratodirecto.com` por defecto en backend).

## Formatos

| Formato | Medida | Uso | Nota de adaptación |
|---|---|---|---|
| Cuadrado | 1080×1080 | Instagram feed | Encuadre central; texto min. 40 px |
| Horizontal | 1920×1080 | YouTube | Espacio para lower-thirds y end screen |
| Vertical | 1080×1920 | Stories / Reels / WhatsApp | Zona segura central (evitar 250 px superiores e inferiores); CTA en los últimos 5 s con link/sticker |

**Duración total: 45 s** (6 bloques de guion, 6 escenas).
