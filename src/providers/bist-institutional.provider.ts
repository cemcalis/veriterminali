/**
 * BIST institutional data: 25-level order book depth, broker distribution
 * (AKD), auction theoretical price, and settlement (takas) breakdowns.
 *
 * These four datasets are NOT available through any free or public API.
 * Borsa İstanbul only exposes them through VERDA (its BISTECH data
 * distribution API), which requires an institutional BISTECH Connect
 * membership and a signed user-creation certificate -- see
 * https://www.borsaistanbul.com/files/bistech-verda-http-rest-api-entegrasyon-dokumani_v106.pdf.
 * The unofficial TradingView-twc socket this project otherwise relies on
 * for BIST last-price does not carry any of these message types either.
 *
 * Rather than fabricate numbers or silently return empty data, every
 * method here returns a typed `unavailable` result so the UI can show an
 * honest "requires a licensed data vendor" state. Once a vendor contract
 * exists, set BIST_L2_VENDOR (and its credentials) and implement
 * `loadVendorAdapter()` below -- no other call site needs to change.
 */

export type InstitutionalResult<T> =
  | { available: true; data: T; asOf: number; source: string }
  | { available: false; reason: 'licensed_data_required'; message: string; vendorOptions: string[] };

export interface OrderBookLevel {
  price: number;
  size: number;
}

export interface OrderBookSnapshot {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export interface BrokerDistributionRow {
  brokerCode: string;
  brokerName: string;
  buyLots: number;
  sellLots: number;
  netLots: number;
  marketSharePercent: number;
}

export interface TheoreticalPriceSnapshot {
  symbol: string;
  theoreticalPrice: number;
  auctionPhase: 'opening' | 'closing';
}

export interface SettlementRow {
  date: string;
  grossLots: number;
  netLots: number;
}

const UNAVAILABLE_MESSAGE =
  'Bu veri Borsa İstanbul’un lisanslı VERDA/BISTECH API’si veya yetkili bir veri sağlayıcı (Foreks, Matriks, Bloomberg, Refinitiv) gerektirir. Herhangi bir ücretsiz/genel API bu veri setini sağlamaz.';
const VENDOR_OPTIONS = ['Borsa İstanbul VERDA (BISTECH Connect üyeliği)', 'Foreks', 'Matriks Data', 'Bloomberg', 'Refinitiv'];

function unavailable<T>(): InstitutionalResult<T> {
  return { available: false, reason: 'licensed_data_required', message: UNAVAILABLE_MESSAGE, vendorOptions: VENDOR_OPTIONS };
}

export class BistInstitutionalDataProvider {
  private vendorConfigured = Boolean(process.env.BIST_L2_VENDOR);

  async getDepth(_symbol: string): Promise<InstitutionalResult<OrderBookSnapshot>> {
    if (!this.vendorConfigured) return unavailable();
    // Extension point: dynamically load and delegate to a vendor adapter
    // module named by BIST_L2_VENDOR once one is actually integrated.
    return unavailable();
  }

  async getBrokerDistribution(
    _symbol: string,
    _from: string,
    _to: string,
  ): Promise<InstitutionalResult<BrokerDistributionRow[]>> {
    if (!this.vendorConfigured) return unavailable();
    return unavailable();
  }

  async getTheoreticalPrice(_symbol: string): Promise<InstitutionalResult<TheoreticalPriceSnapshot>> {
    if (!this.vendorConfigured) return unavailable();
    return unavailable();
  }

  async getSettlement(_symbol: string, _from: string, _to: string): Promise<InstitutionalResult<SettlementRow[]>> {
    if (!this.vendorConfigured) return unavailable();
    return unavailable();
  }
}
