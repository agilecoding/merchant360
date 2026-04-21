import { test as teardown } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

teardown('clear auth state', async () => {
  const dir = path.join(__dirname, 'fixtures/auth');
  for (const f of ['admin.json', 'analyst.json', 'merchant.json']) {
    const p = path.join(dir, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
});
