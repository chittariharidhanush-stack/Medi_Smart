import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(fileURLToPath(import.meta.url));
const dist = resolve(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(resolve(root, 'index.html'), resolve(dist, 'index.html'));
await cp(resolve(root, 'src'), resolve(dist, 'src'), { recursive: true });
try { await cp(resolve(root, 'public'), resolve(dist, 'public'), { recursive: true }); } catch (e) { if (e.code !== 'ENOENT') throw e; }
console.log('Medi Smart frontend build completed successfully: dist/');
