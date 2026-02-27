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

The proxy solves all of this: the server fetches the VidSrc HTML, strips the unwanted scripts, and serves the cleaned HTML from the app's own origin (`/api/embed?url=...`). The client then loads it in a sandboxed `<iframe>`.

### Request flow

```
Browser
  └─ GET /api/embed?url=https://vsrc.su/embed/movie/27205
       └─ server fetches https://vsrc.su/embed/movie/27205
            └─ cleanEmbedHtml() strips bad scripts
                 └─ returns cleaned HTML as text/html
                      └─ <iframe sandbox="allow-scripts allow-same-origin" src="/api/embed?url=...">
```

The embed page itself contains a nested `<iframe src="//cloudnestra.com/rcp/...">` that loads the actual video player. That sub-iframe is loaded directly by the browser; it never passes through the proxy.

### Endpoint

```
GET /api/embed?url=<encoded-vidsrc-embed-url>
```

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

Stripping `sbx.js` from the VidSrc HTML (served through the proxy) neutralises check 1 and check 2 for the outer frame. The cloudnestra sub-iframe loads its own copy of `sbx.js` directly from `cloudnestra.com` — we cannot strip that one. The iframe sandbox configuration is designed to defuse it; see [Sandbox tradeoffs](#sandbox-tradeoffs) below.

### 3. Bad inline `<script>` blocks (`BAD_INLINE_SCRIPT_PATTERNS`)

| Pattern                  | Why stripped                                                                                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/DisableDevtool\s*\(/i` | After the `<script src="disable-devtool...">` is removed, VidSrc still has an inline `DisableDevtool({...})` config call that would throw a ReferenceError at best or execute against a stale cached copy at worst |
| `/_Hasync\s*=/i`         | Any residual Histats bootstrap not caught by the comment-block regex                                                                                                                                               |

---

## Sandbox tradeoffs

The client renders the embed as:

```html
<iframe
  sandbox="allow-scripts allow-same-origin"
  allow="fullscreen; picture-in-picture"
  allowfullscreen
  referrerpolicy="no-referrer"
  src="/api/embed?url=..."
/>
```

### Why `allow-scripts`

The player requires JavaScript to function. Without it, the embed renders as inert static HTML — the play button has no handler and nothing loads.

### Why `allow-same-origin` is also required

`allow-scripts` alone is not sufficient. The cloudnestra sub-iframe loads its own `sbx.js` (which we cannot strip). That script's check 2 calls `document.domain = document.domain`. When `allow-same-origin` is absent the browsing context has an opaque origin, and this mutation throws a `SecurityError` whose message contains the word `"sandbox"` — which `sbx.js` explicitly looks for to trigger its redirect. Adding `allow-same-origin` suppresses the error, defusing check 2.

Check 1 (`window.frameElement.hasAttribute("sandbox")`) is also neutralised: the cloudnestra iframe is cross-origin from the VidSrc frame, so `window.frameElement` returns `null` (cross-origin access is blocked by the browser), and the `hasAttribute` call throws a `TypeError` that is caught and swallowed.

### The `allow-same-origin` risk

`allow-scripts + allow-same-origin` together are traditionally described as a "sandbox escape" because the embedded content can access the host origin's cookies and `localStorage`. This is a real tradeoff:

- **Mitigated** — the server strips the scripts most likely to exfiltrate data (disable-devtool, Histats, sbx.js, obscure TLD trackers)
- **Mitigated** — this project sets no sensitive session cookies; the TMDB API key is a server-side environment variable and is never sent to the client
- **Residual risk** — if VidSrc/cloudnestra were ever to serve weaponised JS, it would run with same-origin access to this app's origin. Acceptable for a personal media wrapper; not acceptable for an app with user authentication or sensitive stored data

### What the sandbox still blocks (permissions not granted)

| Capability                       | Blocked because                          |
| -------------------------------- | ---------------------------------------- |
| Navigate the top-level page      | `allow-top-navigation` not set           |
| Open popup windows               | `allow-popups` not set                   |
| Submit forms to external servers | `allow-forms` not set                    |
| Pointer lock                     | `allow-pointer-lock` not set             |
| `window.opener` escape           | `allow-popups-to-escape-sandbox` not set |

The `referrerpolicy="no-referrer"` attribute additionally prevents the embed from learning the URL of the page it is embedded in via `Referer` headers.

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
