import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const out = path.resolve('apps/web/public/pyrneo-logo.png');
const url = 'https://pyrneo.com/wp-content/themes/pyrneo-ai-theme/assets/img/pyrneo-logo-wordmark.png';
await mkdir(path.dirname(out), { recursive: true });
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  await writeFile(out, Buffer.from(await response.arrayBuffer()));
  console.log(`Pyrneo logo written to ${out}`);
} catch (error) {
  console.warn(`Could not fetch Pyrneo PNG (${error}). The committed transparent SVG remains available as a fallback.`);
}
