/**
 * Takasbank (Turkey's official CSD/clearing house) public CSV feeds --
 * genuinely public, unauthenticated, verified live against
 * wwwdata.takasbank.com.tr. Discovered via veriterminali-data/*.py.
 *
 * IMPORTANT SCOPE NOTE: these are narrow, specific Takasbank datasets --
 * NOT general per-stock equity settlement ("takas") data. Do not confuse
 * them with bist-institutional.provider.ts's getSettlement(), which
 * covers the T+2 net/gross settlement obligations per stock that
 * requires a licensed VERDA/BISTECH feed and remains unavailable here:
 *
 *  - repoAllocationPrices(): daily "tahsis fiyatları" (allocation prices)
 *    for repo/reverse-repo eligible securities (mostly government bonds/
 *    T-bills), published once per trading day as a dated CSV. Product-
 *    facing label: "Repo / Tahvil Tahsis Verileri".
 *  - kasiAssetCodes(): a static reference table mapping VİOP-eligible
 *    collateral asset codes to descriptions (foreign equities usable as
 *    margin collateral) -- metadata, not a price feed. Product-facing
 *    label: "VİOP Teminat Varlık Referansı".
 *
 * Both are read-only public CSV downloads; the SPAN margin CSV URL
 * guessed in the source scripts (viop/SPAN/SPAN.csv) returned 404 on
 * verification and is intentionally not implemented here.
 */
const REPO_BASE = 'https://wwwdata.takasbank.com.tr/RepoAllocationPrice/PROD';
const KASI_URL = 'https://wwwdata.takasbank.com.tr/viop/KASI/KASIVARLIK.csv';

const BROWSER_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

export interface RepoAllocationRow {
  series: string;
  price: number;
  date: string;
}

export interface KasiAssetRow {
  code: string;
  description: string;
}

function todayYyyymmdd(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/** "Repo / Tahvil Tahsis Verileri" -- daily repo/bond allocation prices.
 * Not equity settlement data; see file header. */
export async function repoAllocationPrices(dateStr = todayYyyymmdd()): Promise<RepoAllocationRow[]> {
  const res = await fetch(`${REPO_BASE}/RepoAllocationPrices_${dateStr}.csv`, { headers: BROWSER_HEADERS });
  if (!res.ok) return [];
  const raw = await res.text();
  const lines = raw.trim().split('\n');
  const rows: RepoAllocationRow[] = [];
  for (const line of lines.slice(1)) {
    const parts = line.split(',');
    if (parts.length < 3) continue;
    const price = Number(parts[1]);
    if (!Number.isFinite(price)) continue;
    rows.push({ series: parts[0], price, date: parts[2].trim() });
  }
  return rows;
}

/** "VİOP Teminat Varlık Referansı" -- static asset code/description
 * lookup table, not live market data; see file header. */
export async function kasiAssetCodes(): Promise<KasiAssetRow[]> {
  const res = await fetch(KASI_URL, { headers: BROWSER_HEADERS });
  if (!res.ok) return [];
  const raw = await res.text();
  const lines = raw.trim().split('\n');
  const rows: KasiAssetRow[] = [];
  for (const line of lines.slice(1)) {
    const [code, ...rest] = line.split(',');
    if (!code || rest.length === 0) continue;
    rows.push({ code: code.trim(), description: rest.join(',').trim() });
  }
  return rows;
}
