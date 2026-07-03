import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { JsonStore } from '../store/json-store.js';

export interface ScannerPreset {
  id: string;
  name: string;
  filters: Record<string, string | number>;
  createdAt: number;
}

export function scannerPresetsRouter() {
  const router = Router();
  const store = new JsonStore<ScannerPreset[]>(
    fileURLToPath(new URL('../../data/scanner-presets.json', import.meta.url)),
    [],
  );

  router.get('/', (_req, res) => {
    res.json({ presets: store.read() });
  });

  router.post('/', (req, res) => {
    const { name, filters } = req.body ?? {};
    if (!name || typeof name !== 'string' || typeof filters !== 'object' || filters === null) {
      return res.status(400).json({ error: 'name and filters are required' });
    }
    const preset: ScannerPreset = { id: randomUUID(), name, filters, createdAt: Date.now() };
    const presets = store.write((data) => [...data, preset]);
    res.status(201).json({ presets });
  });

  router.delete('/:id', (req, res) => {
    const presets = store.write((data) => data.filter((p) => p.id !== req.params.id));
    res.json({ presets });
  });

  return router;
}
