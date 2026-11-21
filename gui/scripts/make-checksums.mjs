// Generate release/SHA256SUMS.txt for the release artifacts (*.exe, *.zip).
// Usage: pnpm -F @otp/gui checksums
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const releaseDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'release');
const files = (await readdir(releaseDir)).filter((f) => /\.(exe|zip)$/i.test(f)).sort();
if (!files.length) {
  console.error('no release artifacts (*.exe / *.zip) found in gui/release');
  process.exit(1);
}
const lines = [];
for (const f of files) {
  const buf = await readFile(join(releaseDir, f));
  lines.push(`${createHash('sha256').update(buf).digest('hex')}  ${f}`);
}
await writeFile(join(releaseDir, 'SHA256SUMS.txt'), lines.join('\r\n') + '\r\n');
console.log(`wrote release/SHA256SUMS.txt (${files.length} files)`);
