import { ContentfulStatusCode } from 'hono/utils/http-status';
import { CONFIG } from './config';

// Patterns matched against <script src="..."> to decide if the tag should be stripped
const BAD_SCRIPT_SRC_PATTERNS = [
  /disable-devtool/i,
  /histats\.com/i,
  /unpkg\.com\/disable-devtool/i,
  // sbx.js — sandbox-detection script that redirects the iframe to /sbx.html when it
  // detects a sandboxed browsing context via window.frameElement.hasAttribute("sandbox")
  // or a document.domain mutation error. Must be stripped before the iframe is served so
  // the sandbox attribute on our <iframe> doesn't trigger the redirect.
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
  | { ok: true; html: string }
  | {
      ok: false;
      status: ContentfulStatusCode;
      message: string;
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

  const cleanedHtml = cleanEmbedHtml(rawResult.html);
  return { ok: true, html: cleanedHtml };
};
