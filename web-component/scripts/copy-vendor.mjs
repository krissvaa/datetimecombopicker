/**
 * Copies the forked vendor JS modules (and their hand-written declarations)
 * into dist/, since tsc only compiles the TypeScript sources.
 */
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src', 'vendor');
const dest = join(root, 'dist', 'vendor');

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`Copied vendor modules to ${dest}`);
