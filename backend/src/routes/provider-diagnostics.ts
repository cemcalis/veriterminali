import { Router } from 'express';
import type { MarketHub } from '../market-hub.js';

/** Developer-facing provider health/diagnostics. Never surfaced to
 * normal users directly -- the frontend only renders this in debug mode
 * (Ayarlar). Always returns 200; a provider being unhealthy is a normal,
 * expected state to report, not a route failure. */
export function providerDiagnosticsRouter(hub: MarketHub) {
  const router = Router();

  router.get('/', async (_req, res) => {
    const diagnostics = await hub.providerDiagnostics();
    res.json(diagnostics);
  });

  return router;
}
