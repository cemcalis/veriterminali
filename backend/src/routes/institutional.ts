import { Router } from 'express';
import { BistInstitutionalDataProvider } from '../../../src/providers/bist-institutional.provider.js';

/** Depth / AKD / theoretical price / settlement -- see
 * bist-institutional.provider.ts for why these are honestly
 * vendor-gated rather than faked. Every route returns HTTP 200 with a
 * typed `available: false` body (not a 4xx/5xx) because this is an
 * expected, documented product state, not a request failure. */
export function institutionalRouter() {
  const router = Router();
  const provider = new BistInstitutionalDataProvider();

  router.get('/depth/:symbol', async (req, res) => {
    res.json(await provider.getDepth(decodeURIComponent(req.params.symbol)));
  });

  router.get('/akd/:symbol', async (req, res) => {
    const from = String(req.query.from ?? '');
    const to = String(req.query.to ?? '');
    res.json(await provider.getBrokerDistribution(decodeURIComponent(req.params.symbol), from, to));
  });

  router.get('/teorik/:symbol', async (req, res) => {
    res.json(await provider.getTheoreticalPrice(decodeURIComponent(req.params.symbol)));
  });

  router.get('/takas/:symbol', async (req, res) => {
    const from = String(req.query.from ?? '');
    const to = String(req.query.to ?? '');
    res.json(await provider.getSettlement(decodeURIComponent(req.params.symbol), from, to));
  });

  return router;
}
