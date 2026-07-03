/**
 * Real client for KAP (Kamuyu Aydınlatma Platformu) -- Turkey's official
 * public disclosure platform for listed companies, kap.org.tr. This is
 * genuinely free and public: no API key, no institutional membership.
 * KAP itself republishes new disclosures roughly every 3 minutes; polling
 * more aggressively (this project polls per-request with a short cache,
 * see routes/news.ts) is the same pattern used by several open-source KAP
 * tools (e.g. cahitihac/kap-notifier).
 *
 * KAP doesn't expose a documented JSON API for disclosures -- these
 * endpoints are the ones its own Next.js frontend calls, verified by hand
 * against the live site. If KAP changes its frontend build, the regexes
 * here will need updating; that's a normal scraping-maintenance cost, not
 * a licensing wall (unlike the BIST institutional data in
 * bist-institutional.provider.ts).
 */

const BIST_COMPANIES_URL = 'https://www.kap.org.tr/tr/bist-sirketler';
const DISCLOSURE_URL = 'https://www.kap.org.tr/tr/bildirim-sorgu-sonuc';
const CALENDAR_API_URL = 'https://kap.org.tr/tr/api/expected-disclosure-inquiry/company';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: '*/*',
  'Accept-Language': 'tr',
};

export interface KapDisclosure {
  publishDate: string; // "DD.MM.YYYY HH:mm:ss"
  disclosureIndex: string;
  title: string;
  url: string;
}

export interface KapExpectedDisclosure {
  startDate: string;
  endDate: string;
  subject: string;
  period: string;
  year: string;
}

const OID_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let oidMap: Map<string, string> | null = null;
let oidCachedAt = 0;

async function getMemberOidMap(): Promise<Map<string, string>> {
  if (oidMap && Date.now() - oidCachedAt < OID_CACHE_TTL_MS) return oidMap;

  const res = await fetch(BIST_COMPANIES_URL, { headers: BROWSER_HEADERS });
  if (!res.ok) throw new Error(`KAP bist-sirketler fetch failed: ${res.status}`);
  const html = await res.text();

  // The page embeds its Next.js data as an escaped JSON blob; company
  // records look like:
  // \"mkkMemberOid\":\"xxx\",\"kapMemberTitle\":\"...\",\"relatedMemberTitle\":\"...\",\"stockCode\":\"THYAO\"
  const pattern =
    /\\"mkkMemberOid\\":\\"([^\\"]+)\\",\\"kapMemberTitle\\":\\"[^\\"]+\\",\\"relatedMemberTitle\\":\\"[^\\"]*\\",\\"stockCode\\":\\"([^\\"]+)\\"/g;

  const map = new Map<string, string>();
  for (const match of html.matchAll(pattern)) {
    const [, oid, codesRaw] = match;
    for (const code of codesRaw.split(',')) {
      const trimmed = code.trim();
      if (trimmed) map.set(trimmed, oid);
    }
  }
  oidMap = map;
  oidCachedAt = Date.now();
  return map;
}

/** Strips our internal "BIST:" prefix and Yahoo-style ".IS" suffix so a
 * catalog symbol like "BIST:THYAO" maps to KAP's bare "THYAO" code. */
function bareSymbol(symbol: string): string {
  return symbol.replace(/^BIST:/, '').replace(/\.IS$/i, '').toUpperCase();
}

export async function getMemberOid(symbol: string): Promise<string | null> {
  const map = await getMemberOidMap();
  return map.get(bareSymbol(symbol)) ?? null;
}

export async function getDisclosures(symbol: string, limit = 20): Promise<KapDisclosure[]> {
  const oid = await getMemberOid(symbol);
  if (!oid) return [];

  const res = await fetch(`${DISCLOSURE_URL}?member=${oid}`, { headers: BROWSER_HEADERS });
  if (!res.ok) throw new Error(`KAP disclosure fetch failed: ${res.status}`);
  const html = await res.text();

  const pattern = /publishDate\\":\\"([^\\"]+)\\".{0,400}?disclosureIndex\\":(\d+).{0,400}?title\\":\\"([^\\"]+)\\"/gs;
  const items: KapDisclosure[] = [];
  for (const match of html.matchAll(pattern)) {
    const [, publishDate, disclosureIndex, title] = match;
    items.push({ publishDate, disclosureIndex, title, url: `https://www.kap.org.tr/tr/Bildirim/${disclosureIndex}` });
    if (items.length >= limit) break;
  }
  return items;
}

export async function getExpectedDisclosures(symbol: string): Promise<KapExpectedDisclosure[]> {
  const oid = await getMemberOid(symbol);
  if (!oid) return [];

  const now = new Date();
  const startDate = now.toISOString().slice(0, 10);
  const end = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
  const endDate = end.toISOString().slice(0, 10);

  const res = await fetch(CALENDAR_API_URL, {
    method: 'POST',
    headers: { ...BROWSER_HEADERS, 'Content-Type': 'application/json', Origin: 'https://kap.org.tr' },
    body: JSON.stringify({
      startDate,
      endDate,
      memberTypes: ['IGS'],
      mkkMemberOidList: [oid],
      disclosureClass: '',
      subjects: [],
      mainSector: '',
      sector: '',
      subSector: '',
      market: '',
      index: '',
      year: '',
      term: '',
      ruleType: '',
    }),
  });
  if (!res.ok) throw new Error(`KAP expected-disclosure fetch failed: ${res.status}`);
  const data = (await res.json()) as Array<Record<string, unknown>>;
  return data.map((item) => ({
    startDate: String(item.startDate ?? ''),
    endDate: String(item.endDate ?? ''),
    subject: String(item.subject ?? ''),
    period: String(item.ruleTypeTerm ?? ''),
    year: String(item.year ?? ''),
  }));
}
