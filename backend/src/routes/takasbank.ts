import { Router } from 'express';
import { repoAllocationPrices, kasiAssetCodes } from '../../../src/providers/takasbank-client.js';

/** Takasbank public CSV reference data. Deliberately separate from
 * /api/institutional (which honestly reports equity depth/AKD/takas/
 * theoretical price as licensed-data-required) -- these are narrow,
 * specific Takasbank datasets, not general per-stock settlement data.
 * See src/providers/takasbank-client.ts for the full scope note. */

const KASI_TTL_MS = 24 * 60 * 60 * 1000; // static reference table, rarely changes
let kasiCache: { rows: Awaited<ReturnType<typeof kasiAssetCodes>>; fetchedAt: number } | null = null;

export function takasbankRouter() {
  const router = Router();

  router.get('/repo-tahsis', async (_req, res) => {
    const rows = await repoAllocationPrices();
    res.json({
      label: 'Repo / Tahvil Tahsis Verileri',
      note: 'Takasbank repo/ters-repo işlemlerine konu menkul kıymetlerin günlük tahsis fiyatları. Hisse senedi takas (T+2 uzlaşma) verisi DEĞİLDİR.',
      asOf: new Date().toISOString().slice(0, 10),
      count: rows.length,
      data: rows,
    });
  });

  router.get('/viop-teminat-referans', async (_req, res) => {
    if (!kasiCache || Date.now() - kasiCache.fetchedAt > KASI_TTL_MS) {
      const rows = await kasiAssetCodes();
      if (rows.length > 0) kasiCache = { rows, fetchedAt: Date.now() };
    }
    const rows = kasiCache?.rows ?? [];
    res.json({
      label: 'VİOP Teminat Varlık Referansı',
      note: 'VİOP teminat olarak kabul edilen varlık kodu/açıklama referans listesi. Canlı piyasa verisi DEĞİLDİR.',
      count: rows.length,
      data: rows,
    });
  });

  return router;
}
