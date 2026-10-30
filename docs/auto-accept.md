# Aceptación automática de reservas

Toma las reservas `pending`, les asigna la mesa más eficiente, las confirma (mismo webhook de n8n que el botón
"Confirmar") y avisa por Telegram. Lo que no puede resolver queda `pending` y se reporta.

## Cómo decide

- **Hora y tamaño del grupo se normalizan** (`lib/time.ts`): `"7:00 PM"`, `"19:00"` y `"7pm"` son la misma hora;
  `"3-4"` cuenta como 4. Comparar la hora como texto fue lo que dejaba reservas del formulario web invisibles en el
  mapa de mesas y permitía dobles asignaciones.
- **Mesa más eficiente** (`lib/auto-assign.ts`): la de menor capacidad que alcance (menos asientos desperdiciados).
  Empate → la que rompe menos combos intactos (01-02-03SA, 04-05SA, 08-09-10SA siguen libres para grupos grandes).
  06SA siempre va con 07SA.
- **Grupos del formulario** (1-2, 3-4, 5-6, 7-8, 9+): coinciden con las mesas (4p, 4p, 6p, 8p). En "9+" el formulario guarda
  el número exacto.
  - 9–12 pax: dos mesas de 6p contiguas (01+02, 02+03, 08+09, 09+10), como ya las arma el personal.
  - 13–16: 04-05SA. 17–18: 01-02-03SA u 08-09-10SA. Más de 18: se unen bloques con aviso de verificar que queden juntos.
  - Si no queda ningún bloque, mesas sueltas con el mismo aviso.
- **Ocupación**: una mesa queda tomada `SEATING_MINUTES` (2 h) alrededor de su hora. Reservas confirmadas sin mesa
  guardada también apartan una (virtual, no se escribe).
- **Respeta lo manual**: pendientes con mesas elegidas por el personal no se tocan; el `UPDATE` solo aplica si la fila
  sigue `pending`.

## Cuándo avisa de un problema (queda pendiente)

| Código | Significa |
|---|---|
| `full` | No hay mesa/combinación libre en esa franja |
| `too_large` | Grupo mayor a la capacidad automática del salón (60) |
| `outside_hours` | Fuera de 3:00–9:30 PM (`FIRST/LAST_SEATING_MIN`) |
| `bad_time` / `bad_party` | Hora o tamaño ilegible / 0 |
| `past` | La hora de hoy ya pasó |

Cada problema se avisa **una vez** (`reservations.auto_accept_note`). Si una mesa se libera después, la reserva se
acepta sola en la siguiente corrida y Telegram lo indica.

## Cuándo corre

1. **Al instante** tras cada reserva del formulario web (`app/api/reservations/route.ts`, con tope de 8 s; si falla,
   la reserva queda pendiente).
2. **Barrido** `GET|POST /api/cron/auto-accept` con `Authorization: Bearer $CRON_SECRET` — para reservas que entran por
   otro camino (bot de WhatsApp). Llamarlo cada ~5 min desde n8n o Vercel Cron (Vercel Hobby solo permite 1×/día).
   `?dryRun=1` muestra qué haría sin escribir ni avisar.

## Puesta en marcha

1. Aplicar `supabase/migrations/006_auto_accept_note.sql` (una columna nullable en `reservations`).
2. `scripts/telegram-setup.ps1` en tu terminal (crea el chat id y un `CRON_SECRET`).
3. Variables en Vercel: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `CRON_SECRET`, `AUTO_ACCEPT_ENABLED=true`.
4. Redeploy. Probar primero con `?dryRun=1`.

`AUTO_ACCEPT_ENABLED` es el interruptor: cualquier valor distinto de `true` apaga todo (el endpoint solo deja `dryRun`).

## Pruebas

`npm test` (lógica de asignación + orquestador con BD simulada).
