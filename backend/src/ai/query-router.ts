import type { MarketHub } from '../market-hub.js';
import { getDisclosures } from '../../../src/providers/kap-client.js';
import { classifyDisclosure, DISCLOSURE_CATEGORY_LABELS_TR } from '../../../src/providers/kap-classifier.js';

/**
 * Answers are always assembled from our own live data fetches below --
 * quotes from MarketHub, disclosures from the real KAP client. An LLM
 * (if ANTHROPIC_API_KEY is set) is only ever used to (a) extract which
 * symbol/intent a free-text Turkish question refers to, and (b) phrase
 * the final sentence -- never to originate a price, a fact, or "advice".
 * Every response carries the raw grounded data plus a fixed disclaimer,
 * so nothing here can be mistaken for investment advice under Turkish
 * capital markets law (SPK).
 */

export interface AiAnswer {
  answer: string;
  groundedData: unknown;
  sources: string[];
  disclaimer: string;
}

const DISCLAIMER =
  'Bu yanıt yalnızca gerçek, canlı veriye dayanır ve yatırım tavsiyesi değildir. Yatırım kararlarınızı almadan önce kendi araştırmanızı yapınız.';

function extractSymbolToken(question: string): string | null {
  const upper = question.toUpperCase();
  const match = upper.match(/\b([A-ZÇĞİÖŞÜ]{3,6})\b/);
  return match ? match[1] : null;
}

async function resolveSymbol(hub: MarketHub, token: string) {
  const direct = hub.findDef(token) ?? hub.findDef(`BIST:${token}`) ?? hub.findDef(`BINANCE:${token}`);
  if (direct) return direct;
  const matches = hub.searchLocal(token, 1);
  return matches[0] ?? null;
}

async function answerQuote(hub: MarketHub, question: string): Promise<AiAnswer | null> {
  const token = extractSymbolToken(question);
  if (!token) return null;
  const def = await resolveSymbol(hub, token);
  if (!def) return null;
  const quote = await hub.getQuoteWithFallback(def);
  if (!quote?.price) return null;
  const chg = quote.changePercent != null ? `${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%` : '';
  return {
    answer: `${def.displayNameTr} (${def.symbol}) şu anda ${quote.price} seviyesinde${chg ? `, günlük değişim ${chg}` : ''}.`,
    groundedData: quote,
    sources: [`veriterminali canlı veri akışı (${quote.provider})`],
    disclaimer: DISCLAIMER,
  };
}

async function answerNews(hub: MarketHub, question: string): Promise<AiAnswer | null> {
  if (!/haber|bildirim|kap\b|duyuru/i.test(question)) return null;
  const token = extractSymbolToken(question);
  if (!token) return null;
  const def = await resolveSymbol(hub, token);
  if (!def || def.category !== 'bist') return null;
  const disclosures = await getDisclosures(def.symbol, 5);
  if (disclosures.length === 0) {
    return {
      answer: `${def.displayNameTr} için son KAP bildirimlerine ulaşılamadı.`,
      groundedData: [],
      sources: ['KAP (kap.org.tr)'],
      disclaimer: DISCLAIMER,
    };
  }
  const list = disclosures
    .map((d) => `${d.publishDate} — ${d.title} [${DISCLOSURE_CATEGORY_LABELS_TR[classifyDisclosure(d.title)]}]`)
    .join('\n');
  return {
    answer: `${def.displayNameTr} için en son KAP bildirimleri:\n${list}`,
    groundedData: disclosures,
    sources: disclosures.map((d) => d.url),
    disclaimer: DISCLAIMER,
  };
}

async function answerScannerTop(hub: MarketHub, question: string): Promise<AiAnswer | null> {
  const lower = question.toLowerCase();
  const wantsGainers = /yüksel|kazan|artan|tavan/.test(lower);
  const wantsLosers = /düş|kaybed|azalan|dip/.test(lower);
  if (!wantsGainers && !wantsLosers) return null;

  const all = hub.allLatest().filter((q) => q.price !== null && q.changePercent !== null);
  const sorted = all.sort((a, b) => ((b.changePercent ?? 0) - (a.changePercent ?? 0)) * (wantsGainers ? 1 : -1));
  const top = sorted.slice(0, 5);
  if (top.length === 0) return null;

  const list = top
    .map((q) => `${q.symbol}: ${q.price} (${(q.changePercent ?? 0) >= 0 ? '+' : ''}${(q.changePercent ?? 0).toFixed(2)}%)`)
    .join('\n');
  return {
    answer: `Şu anda en çok ${wantsGainers ? 'yükselen' : 'düşen'} 5 enstrüman:\n${list}`,
    groundedData: top,
    sources: ['veriterminali canlı fiyat önbelleği'],
    disclaimer: DISCLAIMER,
  };
}

/** Rule-based intent routing over real Turkish keyword patterns. No LLM
 * required for these -- covers the common questions outright. */
export async function answerQuestion(hub: MarketHub, question: string): Promise<AiAnswer> {
  const trimmed = question.trim();
  const handlers = [answerScannerTop, answerNews, answerQuote];
  for (const handler of handlers) {
    const result = await handler(hub, trimmed).catch(() => null);
    if (result) return result;
  }
  return {
    answer:
      'Bu soruyu canlı verilerimizle yanıtlayamadım. Bir sembol adı (örn. "GARAN fiyatı nedir", "THYAO haberleri", "en çok yükselenler") belirterek tekrar deneyebilirsiniz.',
    groundedData: null,
    sources: [],
    disclaimer: DISCLAIMER,
  };
}
