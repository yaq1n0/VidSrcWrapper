/**
 * Deep debug script for VidSrc embeds.
 *
 * Uses wget to recursively mirror the embed page and all its dependencies
 * (scripts, iframes, sub-pages) into /tmp/vidsrc-deep/<seed-name>/.
 * Nothing is executed — purely static source download.
 *
 * Usage:
 *   npm run debug:embed:deep          (from repo root)
 *
 * Requires: wget (brew install wget / apt install wget)
 */

import { execFileSync, execSync } from 'child_process';
import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { CONFIG } from '../config.js';

const OUT_ROOT = '/tmp/vidsrc-deep';
// Level 2 is enough: seed page (0) → iframe player page (1) → player scripts (2).
// Higher values cause wget to follow nav links into full websites (forum, dashboard…).
const RECURSION_DEPTH = 2;

const BASE = CONFIG.VIDSRC_BASE_URL;

// Edit these to test different content
const SEEDS: { name: string; url: string }[] = [
  { name: 'movie-inception', url: `${BASE}/embed/movie/27205` },
  { name: 'tv-breaking-bad-s1e1', url: `${BASE}/embed/tv/1396/1-1` },
];

// ── Preflight ──────────────────────────────────────────────────────────────

try {
  execSync('which wget', { stdio: 'ignore' });
} catch {
  console.error(
    'wget not found. Install it with: brew install wget (macOS) or apt install wget (Linux)'
  );
  process.exit(1);
}

// ── wget invocation ────────────────────────────────────────────────────────

const buildWgetArgs = (url: string, outDir: string): string[] => [
  `--recursive`,
  `--level=${RECURSION_DEPTH}`,
  `--page-requisites`, // fetch scripts/CSS needed to render each page
  `--span-hosts`, // cross-domain (cloudnestra, cdn, etc. are different hosts)
  `--adjust-extension`, // append .html to pages that lack a file extension
  `--no-parent`,
  `--no-check-certificate`,
  // Skip binary/media assets — we only want inspectable source files.
  // Do NOT use --accept here: embed iframes use extension-less URLs (e.g. /rcp/<base64>)
  // that would be incorrectly rejected by an extension allowlist.
  `--reject=eot,woff,woff2,ttf,otf,svg,gif,png,jpg,jpeg,ico,mp4,webp,webm,zip,tar,gz`,
  `--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`,
  `--referer=${new URL(url).origin}`,
  // Block noise: community forums and analytics that appear in nav links but are
  // unrelated to the embed/player chain. Player providers are not excluded.
  `--exclude-domains=vidsrc.community,xenforo.com,www.google.com,www.googletagmanager.com`,
  `--quota=25m`, // hard stop — prevents runaway crawls
  `--wait=0.3`, // be polite
  `--tries=2`,
  `--timeout=15`,
  `--directory-prefix=${outDir}`,
];

// ── Per-seed run ───────────────────────────────────────────────────────────

for (const { name, url } of SEEDS) {
  const outDir = join(OUT_ROOT, name);

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  console.log(`\n${'='.repeat(64)}`);
  console.log(`Seed:  ${name}`);
  console.log(`URL:   ${url}`);
  console.log(`Out:   ${outDir}`);
  console.log(`Depth: ${RECURSION_DEPTH}`);
  console.log('='.repeat(64) + '\n');

  try {
    execFileSync('wget', [...buildWgetArgs(url, outDir), url], {
      stdio: 'inherit',
    });
  } catch {
    // wget exits non-zero on partial failures (e.g. 404 on some assets) — expected
    console.log(
      '\n(wget exited non-zero — partial failures on individual assets are normal)\n'
    );
  }

  // ── Directory tree summary ───────────────────────────────────────────────

  console.log(`\n── Files saved under ${outDir} ──\n`);
  try {
    execFileSync('find', [outDir, '-type', 'f', '-print'], {
      stdio: 'inherit',
    });
  } catch {
    // ignore
  }

  // ── File count + total size ──────────────────────────────────────────────

  try {
    console.log('');
    execFileSync('du', ['-sh', outDir], { stdio: 'inherit' });
  } catch {
    // ignore
  }
}
