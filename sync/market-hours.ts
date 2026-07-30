// Decide si el mercado argentino de acciones (BYMA) esta abierto AHORA,
// y si conviene consultar el dolar. Todo calculado en hora de Argentina (UTC-3).
//
// Nota: Argentina no usa horario de verano, asi que ART = UTC-3 fijo.

const ART_OFFSET_HOURS = -3;

interface ArtNow {
  weekday: number; // 0=domingo ... 6=sabado
  hour: number; // 0-23 en ART
  minute: number;
}

function nowInArt(date = new Date()): ArtNow {
  const art = new Date(date.getTime() + ART_OFFSET_HOURS * 60 * 60 * 1000);
  return {
    weekday: art.getUTCDay(),
    hour: art.getUTCHours(),
    minute: art.getUTCMinutes(),
  };
}

/** Dia habil = lunes a viernes. (Feriados BYMA: se resuelven por dedup, ver README.) */
export function isWeekday(date = new Date()): boolean {
  const { weekday } = nowInArt(date);
  return weekday >= 1 && weekday <= 5;
}

/**
 * Rueda BYMA aproximada: 11:00 a 17:30 ART en dias habiles.
 * Se agranda un poco el cierre para captar el precio de cierre.
 */
export function isStockMarketOpen(date = new Date()): boolean {
  if (!isWeekday(date)) return false;
  const { hour, minute } = nowInArt(date);
  const mins = hour * 60 + minute;
  return mins >= 11 * 60 && mins <= 17 * 60 + 30;
}

/** Fecha de rueda (YYYY-MM-DD) en ART, para daily_prices. */
export function tradeDateArt(date = new Date()): string {
  const art = new Date(date.getTime() + ART_OFFSET_HOURS * 60 * 60 * 1000);
  return art.toISOString().slice(0, 10);
}
