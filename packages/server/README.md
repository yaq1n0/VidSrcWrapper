# @vidsrc-wrapper/server

Hono API server. Proxies TMDB metadata and VidSrc embed pages to the Vue client.

---

## Embed Proxy

### Why a proxy?

VidSrc embed pages cannot be dropped directly into a `<iframe src="https://vsrc.su/embed/...">` and left alone. Several problems arise:

1. **Anti-sandbox scripts** — VidSrc and its player sub-provider (cloudnestra.com) both load `sbx.js`, which detects sandboxed iframes and redirects the frame away to a dead-end page, breaking the player.
2. **Anti-devtool scripts** — `disable-devtool` from unpkg detects open DevTools and redirects/rewrites the page.
3. **Analytics tracking** — Histats.com injects a tracking counter and pixel into every embed page.
4. **Content-Security-Policy friction** — serving the embed from a foreign domain complicates CSP and referrer policy on the host app.

The proxy solves all of this: the server fetches the VidSrc HTML, strips the unwanted scripts, and serves the cleaned HTML from a **dedicated embed origin** (`http://<host>:8081/api/embed?url=...` — a separate listener, see [Origin isolation](#origin-isolation-the-sandbox-replacement)). The client then loads it in an `<iframe>` (deliberately **not** sandboxed — see [Sandbox tradeoffs](#sandbox-tradeoffs)).

### Request flow

```
Browser
  └─ GET http://<host>:8081/api/embed?url=https://vsrc.su/embed/movie/27205   (embed origin, NOT the app origin)
       └─ server fetches https://vsrc.su/embed/movie/27205
            └─ cleanEmbedHtml() strips bad scripts, injectBaseHref() fixes relative URLs
                 └─ returns cleaned HTML as text/html
                      └─ <iframe allow="fullscreen; picture-in-picture" src="http://<host>:8081/api/embed?url=...">
```

The embed page itself contains a nested `<iframe src="//cloudnestra.com/rcp/...">` that loads the actual video player. That sub-iframe is loaded directly by the browser; it never passes through the proxy.

### Endpoint

```
GET /api/embed?url=<encoded-vidsrc-embed-url>     (served ONLY on the embed listener, EMBED_PORT, default 8081)
```

The main API listener (`PORT`, default 8080) deliberately does **not** route `/api/embed` — requesting it there returns 404, so the proxied third-party HTML can never be served same-origin with the app.

- **400** — URL is missing or its origin does not match `CONFIG.VIDSRC_BASE_URL`
- **502** — VidSrc returned a non-2xx response
- **500** — network / unexpected error
- **200** — cleaned HTML, `Content-Type: text/html`

URL validation in `isAllowedEmbedUrl` checks `url.origin === expectedUrl.origin`, preventing the endpoint from being used as an open proxy for arbitrary URLs.

---

## `cleanEmbedHtml` — what it strips and why

Implemented in [src/embedHandlers.ts](src/embedHandlers.ts).

### 1. Histats.com analytics block

```
<!-- Histats.com  (div with counter) --> ... <!-- Histats.com  END  -->
```

VidSrc wraps its entire Histats block in recognisable HTML comments. A single regex strips the counter `<div>`, the inline `_Hasync` bootstrap script, and the `<noscript>` tracking pixel in one pass.

### 2. Bad `<script src="...">` tags (`BAD_SCRIPT_SRC_PATTERNS`)

| Pattern                          | Script                                    | Why stripped                                                                                                              |
| -------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `/disable-devtool/i`             | `disable-devtool@x.x.x` (unpkg)           | Detects open DevTools and redirects/rewrites the page; disables right-click, copy, paste, text selection                  |
| `/unpkg\.com\/disable-devtool/i` | Same, explicit unpkg URL                  | Belt-and-suspenders match for the canonical CDN path                                                                      |
| `/\/sbx\.js/i`                   | `sbx.js` (vidsrcme.ru + cloudnestra.com)  | Sandbox-detection script — see detail below                                                                               |
| `/histats\.com/i`                | `histats.com` JS                          | Histats tracker; the HTML-comment block strip above handles the usual case, this catches any stray `<script src>` variant |
| `/[a-z0-9]{8,}\.(cfd\|rest)\//i` | Hash-named scripts on `.cfd`/`.rest` TLDs | Randomly named tracking/malware scripts observed on obscure TLDs                                                          |

#### `sbx.js` in detail

Both `vidsrcme.ru` and `cloudnestra.com` load a `sbx.js` that runs `dtc_sbx()`:

```js
function dtc_sbx() {
  function r() {
    window.location.href =
      '/sbx.html#' + encodeURIComponent(window.location.href);
  }

  // Check 1: does our <iframe> element have a sandbox attribute?
  try {
    if (window.frameElement.hasAttribute('sandbox')) r();
    return;
  } catch (t) {}

  // Check 2: does document.domain mutation throw a "sandbox" error?
  try {
    document.domain = document.domain;
  } catch (t) {
    try {
      if (-1 != t.toString().toLowerCase().indexOf('sandbox')) r();
      return;
    } catch (t) {}
  }

  // Check 3: PDF plugin trick (Chrome-only)
  var e = document.createElement('object');
  e.data = 'data:application/pdf;base64,aG1t';
  e.onerror = function () {
    r();
  };
  document.body.appendChild(e);
}
```

Stripping `sbx.js` from the VidSrc HTML (served through the proxy) neutralises check 1 and check 2 for the outer frame. The player sub-iframe loads its own copy of `sbx.js` directly from the player host — we cannot strip that one, and it is the reason the client iframe must not be sandboxed; see [Sandbox tradeoffs](#sandbox-tradeoffs) below.

### 3. Bad inline `<script>` blocks (`BAD_INLINE_SCRIPT_PATTERNS`)

| Pattern                  | Why stripped                                                                                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/DisableDevtool\s*\(/i` | After the `<script src="disable-devtool...">` is removed, VidSrc still has an inline `DisableDevtool({...})` config call that would throw a ReferenceError at best or execute against a stale cached copy at worst |
| `/_Hasync\s*=/i`         | Any residual Histats bootstrap not caught by the comment-block regex                                                                                                                                               |

### 4. `<base href>` injection

The embed page references root-relative resources (`/style.css`, `/sources.js`, `/base64.js`, `/jquery-3.7.1.min.js`, ...). Served from the app's own origin those resolve against the app host and 404 — most visibly `style.css`, without which `html`/`body` have no height and the player iframe's `height: 100%` collapses to the 150px iframe default (the player rendered as a thin strip at the top of its box). `injectBaseHref` adds `<base href="<final upstream URL>">` (the post-redirect URL — `vsrc.su` 301s to a mirror domain) at the start of `<head>`, restoring resolution of all relative URLs to the embed host, exactly as if the page were loaded directly.

---

## Sandbox tradeoffs

The client renders the embed as:

```html
<iframe
  allow="fullscreen; picture-in-picture"
  allowfullscreen
  referrerpolicy="no-referrer"
  src="http://<host>:8081/api/embed?url=..."
/>
```

### Why there is no `sandbox` attribute

An earlier iteration used `sandbox="allow-scripts allow-same-origin"`, on the theory that `allow-same-origin` would suppress the `document.domain` `SecurityError` and defuse check 2 of `sbx.js`. Empirically (verified June 2026) this does not hold: sandbox flags propagate from our iframe into every nested browsing context, and assigning `document.domain` in a sandboxed document throws unconditionally — there is **no sandbox token that relaxes it** (the error message itself contains the word "sandbox", which is exactly what `sbx.js` greps for). The player host's own copy of `sbx.js` (loaded directly by the browser inside the nested cross-origin player iframe, never through our proxy) therefore detects the sandbox and redirects its frame to `/sbx.html` — a dead 404 page. Result: black player, no playback, no fullscreen.

Since no combination of sandbox tokens avoids this, the `sandbox` attribute is omitted entirely.

### Origin isolation (the sandbox replacement)

Since the `sandbox` attribute is off the table, the isolation it was *meant* to provide comes from serving the embed on its **own origin** instead:

- The Node server runs a second listener (`EMBED_PORT`, default **8081**) whose only route is `/api/embed`. The main API listener does not serve the embed at all.
- The client builds the iframe `src` against `CONFIG.EMBED_ORIGIN` (default `<protocol>//<hostname>:8081`, overridable with `VITE_EMBED_ORIGIN` at build time).
- In Docker, Nginx exposes the embed listener on container port 81; the documented `docker run` flags publish it as host port 8081 (`-p 8080:80 -p 8081:81`).

Because the embed document is cross-origin to the app, the browser's same-origin policy — which no embedded script can detect or escape, unlike a sandbox attribute — guarantees the embed's JS cannot touch the app's DOM, storage, or cookies. Verified empirically (Playwright, June 2026): `window.parent.document` from the embed frame throws `SecurityError`, while the player chain (rcp → prorcp → Turnstile) loads and fullscreen stays enabled in every frame.

Note this is *stronger* than the old `sandbox="allow-scripts allow-same-origin"` ever was: with `allow-same-origin` on same-origin proxied content, embedded scripts had full access to the app origin anyway (and could even reach up and remove the sandbox attribute). The sandbox's only real contribution was blocking popups and top-level navigation.

### What we lose without `sandbox`, and what remains

Without sandboxing, the embed can (with user activation) open popups and navigate the top-level page — sandbox was the only mechanism that blocked those, and no non-sandbox mechanism exists. Remaining mitigations:

- **Origin isolation** (above) — embed JS runs cross-origin to the app: no DOM, storage, or cookie access
- `allow="fullscreen; picture-in-picture"` — permissions policy grants nothing else (no camera, mic, geolocation, etc.; cross-origin autoplay is also denied by the default `'self'` allowlist)
- `referrerpolicy="no-referrer"` — the embed never learns the URL of the page embedding it
- Server-side `cleanEmbedHtml` — strips the known tracking/anti-devtool/junk scripts from the outer page
- The host app's `postMessage` listener takes no action on any message from the embed
- This project sets no sensitive session cookies; the TMDB API key is a server-side environment variable and is never sent to the client

**Residual risk** — if the embed provider serves weaponised JS it can still, with a user gesture, open popups or redirect the top-level page (annoyance/phishing-grade, not data-theft-grade — origin isolation blocks access to the app itself). Acceptable for a personal media wrapper.

---

## postMessage relay

The VidSrc embed and cloudnestra sub-iframe relay `postMessage` events up to the host page using `window.parent.postMessage(message.data, '*')` with no origin validation. The host app (App.vue) installs a global listener that:

- Silently ignores known player event shapes (`{type: "PLAYER_EVENT"}`)
- `console.warn`s any unexpected message shape for visibility

No action is ever taken on received messages. This prevents the embed's `"reload_page"` message (which would call `window.location.reload()` inside the embed) from being accidentally forwarded to a handler in the host app.

---

## Debug scripts

Two scripts are available for inspecting the raw and cleaned embed HTML.

### `debug:embed` — quick diff

```
npm run debug:embed          # from repo root
cd packages/server && npm run debug:embed
```

Defined in [src/scripts/debugEmbed.ts](src/scripts/debugEmbed.ts).

For each test URL, fetches the raw HTML through the same `fetchRawHtml` + `cleanEmbedHtml` pipeline used by the live server, then writes both versions to `/tmp`:

```
/tmp/vidsrc-movie-inception-raw.html
/tmp/vidsrc-movie-inception-clean.html
/tmp/vidsrc-tv-breaking-bad-s1e1-raw.html
/tmp/vidsrc-tv-breaking-bad-s1e1-clean.html
```

Open the raw and clean files side-by-side to verify exactly which script tags and inline blocks are being removed. Useful when VidSrc updates its embed structure and a new pattern needs to be added to `BAD_SCRIPT_SRC_PATTERNS` or `BAD_INLINE_SCRIPT_PATTERNS`.

### `debug:embed:deep` — full dependency crawl

```
npm run debug:embed:deep     # from repo root
# requires: brew install wget  /  apt install wget
```

Defined in [src/scripts/deepDebugEmbed.ts](src/scripts/deepDebugEmbed.ts).

Uses `wget --recursive` (depth 2) to mirror the embed page and every script, stylesheet, and sub-iframe it references into `/tmp/vidsrc-deep/<seed-name>/`. Nothing is executed — purely static source download. This is how the security audit described in this document was conducted.

```
/tmp/vidsrc-deep/movie-inception/
  vidsrc.me/embed/movie/27205.html     ← outer embed page
  vidsrcme.ru/sbx.js                   ← sandbox detector (stripped by proxy)
  vidsrcme.ru/sources.js               ← server/source switcher UI
  vidsrcme.ru/reporting.js             ← report-a-problem form
  vidsrcme.ru/base64.js                ← custom Base64 impl for token decoding
  cloudnestra.com/sbx.js               ← sandbox detector (not strippable)
  cloudnestra.com/rcp/<hash>.html      ← player wrapper, loads the actual player
  unpkg.com/disable-devtool/...        ← devtool blocker (stripped by proxy)
  ...
```

Key findings from running this script that informed the cleaning strategy:

- Both `vidsrcme.ru` and `cloudnestra.com` independently load `sbx.js` — the pattern must match both paths (`/sbx.js` appears as `/sbx.js?t=<timestamp>` in `<script src>`)
- `disable-devtool` is loaded via `<script src>` AND followed by a separate inline `DisableDevtool({...})` config block — both must be stripped
- Histats is wrapped in recognisable HTML comments that allow a single block-level regex to remove the entire section cleanly
- The cloudnestra `rcp/` page acts as a `postMessage` relay between the VidSrc frame and the actual video player, forwarding all messages with `'*'` as the target origin
- The embed page inspects `window.frameElement.getAttribute('data-ref')` to gate VIP UI features — safe because `data-ref` is not set on the proxy iframe
