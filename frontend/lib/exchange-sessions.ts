import type { MarketCategory } from './types';

export type ExchangeId = 'bist' | 'nasdaq' | 'forex' | 'crypto';

export interface ExchangeSession {
  id: ExchangeId;
  label: string;
  timeZone: string;
  /** Trading window in the exchange's own local time, or null for 24h markets. */
  hours: { open: string; close: string } | null;
  /** Fixed-date holidays (MM-DD, recurs every year) when the exchange is shut.
   * Variable-date holidays (religious/lunar) are NOT included here and must
   * be reviewed annually -- see roadmap Sprint 1.3 note on the exchange
   * calendar needing yearly maintenance. */
  fixedHolidays: string[];
}

const EXCHANGES: Record<ExchangeId, ExchangeSession> = {
  bist: {
    id: 'bist',
    label: 'BIST',
    timeZone: 'Europe/Istanbul',
    hours: { open: '10:00', close: '18:00' },
    fixedHolidays: ['01-01', '04-23', '05-01', '05-19', '07-15', '08-30', '10-29'],
  },
  nasdaq: {
    id: 'nasdaq',
    label: 'NASDAQ',
    timeZone: 'America/New_York',
    hours: { open: '09:30', close: '16:00' },
    fixedHolidays: ['01-01', '07-04', '12-25'],
  },
  forex: {
    id: 'forex',
    label: 'Döviz',
    timeZone: 'UTC',
    // Open Sun 22:00 UTC through Fri 22:00 UTC; modeled as "always open"
    // Mon-Fri and closed on the Sat/Sun edges below via getSession().
    hours: null,
    fixedHolidays: [],
  },
  crypto: {
    id: 'crypto',
    label: 'Kripto',
    timeZone: 'UTC',
    hours: null,
    fixedHolidays: [],
  },
};

export const CATEGORY_TO_EXCHANGE: Record<MarketCategory, ExchangeId> = {
  crypto: 'crypto',
  crypto_futures: 'crypto',
  forex: 'forex',
  commodity: 'forex',
  bist: 'bist',
  us_stock: 'nasdaq',
  etf: 'nasdaq',
  index: 'nasdaq',
};

function partsIn(tz: string, date: Date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    month: '2-digit',
    day: '2-digit',
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    weekday: parts.weekday as string,
    hhmm: `${parts.hour}:${parts.minute}`,
    mmdd: `${parts.month}-${parts.day}`,
  };
}

export interface SessionState {
  exchange: ExchangeId;
  label: string;
  isOpen: boolean;
  reason: 'weekend' | 'holiday' | 'after-hours' | 'open' | '24h';
  localTime: string;
}

export function getSessionState(exchangeId: ExchangeId, now = new Date()): SessionState {
  const ex = EXCHANGES[exchangeId];
  const { weekday, hhmm, mmdd } = partsIn(ex.timeZone, now);
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';

  if (ex.id === 'crypto') {
    return { exchange: ex.id, label: ex.label, isOpen: true, reason: '24h', localTime: hhmm };
  }
  if (ex.id === 'forex') {
    // Closed roughly Fri 22:00 UTC -> Sun 22:00 UTC.
    const closed =
      (weekday === 'Sat') ||
      (weekday === 'Sun' && hhmm < '22:00') ||
      (weekday === 'Fri' && hhmm >= '22:00');
    return { exchange: ex.id, label: ex.label, isOpen: !closed, reason: closed ? 'weekend' : '24h', localTime: hhmm };
  }

  if (isWeekend) {
    return { exchange: ex.id, label: ex.label, isOpen: false, reason: 'weekend', localTime: hhmm };
  }
  if (ex.fixedHolidays.includes(mmdd)) {
    return { exchange: ex.id, label: ex.label, isOpen: false, reason: 'holiday', localTime: hhmm };
  }
  const { open, close } = ex.hours!;
  const isOpen = hhmm >= open && hhmm < close;
  return { exchange: ex.id, label: ex.label, isOpen, reason: isOpen ? 'open' : 'after-hours', localTime: hhmm };
}

export function getAllSessions(now = new Date()): SessionState[] {
  return (['bist', 'nasdaq', 'forex', 'crypto'] as ExchangeId[]).map((id) => getSessionState(id, now));
}
