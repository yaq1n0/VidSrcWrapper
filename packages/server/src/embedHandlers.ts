import { ContentfulStatusCode } from 'hono/utils/http-status';
import { CONFIG } from './config';

// Patterns matched against <script src="..."> to decide if the tag should be stripped
const BAD_SCRIPT_SRC_PATTERNS = [
  /disable-devtool/i,
  /histats\.com/i,
  /unpkg\.com\/disable-devtool/i,
  // sbx.js — sandbox-detection script that redirects the iframe to /sbx.html (a dead
  // 404 page) when it detects a sandboxed browsing context via
  // window.frameElement.hasAttribute("sandbox") or a document.domain mutation error.
  // Stripped as junk-removal for the outer page. Note: the nested player iframe loads
  // its own copy directly (never through this proxy), and its document.domain check
  // fires under ANY sandbox attribute regardless of tokens — which is why the client
  // <iframe> must NOT be sandboxed. See packages/server/README.md "Sandbox tradeoffs".
  /\/sbx\.js/i,
  // Random hash paths on obscure TLDs used for tracking/malware
  /[a-z0-9]{8,}\.(cfd|rest)\//i,
];

// Patterns matched against inline <script> body to decide if the tag should be stripped
const BAD_INLINE_SCRIPT_PATTERNS = [
  // disable-devtool config object (the <script src> is stripped separately, but the
  // inline DisableDevtool({...}) call that follows it must also go)
  /DisableDevtool\s*\(/i,
  // Histats async tracker bootstrap (_Hasync array + dynamic script injection)
  /_Hasync\s*=/i,
];

const expectedUrl = new URL(CONFIG.VIDSRC_BASE_URL);
const isAllowedEmbedUrl = (urlStr: string): boolean => {
  try {
    const url = new URL(urlStr);
    return url.origin === expectedUrl.origin;
  } catch {
    return false;
  }
};

export const cleanEmbedHtml = (html: string): string => {
  // Strip the entire Histats block: VidSrc wraps it in recognisable HTML comments
  // <!-- Histats.com (div with counter) --> ... <!-- Histats.com END -->
  // This removes the counter div, the inline _Hasync bootstrap script, and the
  // noscript tracking pixel in one pass.
  html = html.replace(
    /<!--\s*Histats\.com[\s\S]*?<!--\s*Histats\.com\s+END\s*-->/gi,
    ''
  );

  // Strip <script src="...bad..."></script> and self-closing variants
  html = html.replace(
    /<script\b[^>]*\bsrc\s*=\s*["'][^"']*["'][^>]*(?:>\s*<\/script>|\/>)/gi,
    match => (BAD_SCRIPT_SRC_PATTERNS.some(p => p.test(match)) ? '' : match)
  );

  // Strip inline <script> blocks whose body matches a bad pattern
  // (e.g. the DisableDevtool({...}) config that follows the stripped src tag)
  html = html.replace(
    /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
    (match, body: string) =>
      BAD_INLINE_SCRIPT_PATTERNS.some(p => p.test(body)) ? '' : match
  );

  return html;
};

export type EmbedResult =
  | {
      ok: true;
      html: string;
      /** Final upstream URL after redirects (vsrc.su 301s to a mirror domain) */
      finalUrl?: string;
    }
  | {
      ok: false;
      status: ContentfulStatusCode;
      message: string;
    };

// The embed page references root-relative resources (/style.css, /sources.js,
// /base64.js, ...). Served from our origin those would resolve against the app
// host and 404 — most visibly style.css, without which html/body have no height
// and the player iframe's height:100% collapses to the 150px default. A <base>
// tag pointing at the upstream page restores resolution to the embed host.
export const injectBaseHref = (html: string, baseUrl: string): string => {
  if (/<base\b/i.test(html)) return html;
  const tag = `<base href="${baseUrl.replace(/"/g, '%22')}">`;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, match => `${match}${tag}`);
  }
  return tag + html;
};

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

export const fetchRawHtml = async (url?: string): Promise<EmbedResult> => {
  if (!url || !isAllowedEmbedUrl(url)) {
    return {
      ok: false,
      status: 400,
      message: 'Bad Request: invalid or disallowed embed URL',
    };
  }

  try {
    const parsed = new URL(url);
    const response = await fetch(url, {
      headers: {
        ...HEADERS,
        Referer: parsed.origin,
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        status: 502,
        message: `Upstream error: ${response.status}`,
      };
    }

    return {
      ok: true,
      html: await response.text(),
      finalUrl: response.url || url,
    };
  } catch {
    return {
      ok: false,
      status: 500,
      message: 'Internal Server Error',
    };
  }
};

export const getEmbed = async (url?: string): Promise<EmbedResult> => {
  const rawResult = await fetchRawHtml(url);
  if (!rawResult.ok) {
    return rawResult;
  }

  let cleanedHtml = cleanEmbedHtml(rawResult.html);
  if (rawResult.finalUrl) {
    cleanedHtml = injectBaseHref(cleanedHtml, rawResult.finalUrl);
  }
  return { ok: true, html: cleanedHtml };
};
