/**
 * Debug script for the VidSrc embed proxy.
 *
 * For each TEST_URL, fetches the raw HTML from VidSrc and writes it to /tmp,
 * then runs it through cleanEmbedHtml and writes the cleaned output too.
 * Open both files side-by-side to see exactly what the cleaner strips.
 *
 * Usage:
 *   cd packages/server
 *   npx tsx src/scripts/debugEmbed.ts
 */

import { writeFileSync } from 'fs';
import { cleanEmbedHtml, fetchRawHtml } from '../embedHandlers.js';
import { CONFIG } from '../config.js';

const BASE = CONFIG.VIDSRC_BASE_URL;

// Edit these to test different content
const TEST_URLS: { name: string; url: string }[] = [
  { name: 'tv-breaking-bad-s1e1', url: `${BASE}/embed/tv/1396/1-1` },
  { name: 'movie-inception', url: `${BASE}/embed/movie/27205` },
];

const debugUrl = async ({ name, url }: { name: string; url: string }) => {
  console.log(`\n── ${name}`);
  console.log(`   ${url}`);

  const raw = await fetchRawHtml(url);
  if (!raw.ok) {
    console.error(`   Failed to fetch: ${raw.message} (status ${raw.status})`);
    return;
  }

  const cleaned = cleanEmbedHtml(raw.html);
  const rawPath = `/tmp/vidsrc-${name}-raw.html`;
  const cleanPath = `/tmp/vidsrc-${name}-clean.html`;

  writeFileSync(rawPath, raw.html, 'utf8');
  writeFileSync(cleanPath, cleaned, 'utf8');

  console.log(`   raw     → ${rawPath}  (${raw.html.length} bytes)`);
  console.log(`   cleaned → ${cleanPath}  (${cleaned.length} bytes)`);
};

// run all the tests sequentially
for (const { name, url } of TEST_URLS) {
  await debugUrl({ name, url });
}
