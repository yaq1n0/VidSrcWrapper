# RETRO / ADR — The fullscreen bug and the sandbox that had to go

| | |
| --- | --- |
| **Date** | 2026-06-09 |
| **Status** | Accepted; implemented and verified (pending final manual confirmation in the user's browsers) |
| **Supersedes** | `DEBUGGING.md`, the working diagnosis log for this bug (deleted once this ADR landed — its load-bearing findings are folded in below) |
| **Complements** | [packages/server/README.md](packages/server/README.md) — the operational reference for the embed proxy ("Origin isolation", "Sandbox tradeoffs", "`<base href>` injection") |

## Summary

Two independent defects shipped together in the "Go really hard on security"
commit (6410622), which introduced the embed proxy:

1. **The fullscreen bug** (the reported symptom): the player rendered as a
   ~150px strip because the proxied embed HTML's root-relative resources
   (`/style.css`, `/sources.js`, ...) resolved against our origin and 404'd.
2. **A latent player-killer**: the iframe `sandbox` attribute caused the
   player host's `sbx.js` to redirect the player frame to a dead 404 page —
   masked by defect 1 until it was fixed.

The fix keeps **both** the working player **and** sandbox-grade security, but
not with the `sandbox` attribute (which is provably incompatible with this
embed provider). Isolation is provided by the browser's same-origin policy
instead: the embed proxy is served from a **dedicated origin** (port 8081)
that the app's origin never shares.

## Context

### The architecture

```
top page  http://localhost:3000/...        (Vue app; /api proxied to hono :8080)
└─ <iframe class="player">                 cleaned embed HTML, served by our proxy
   └─ <iframe id="player_iframe">          //<playerhost>/rcp/<token> — loads DIRECTLY from the
      └─ <iframe> /prorcp/<token>            player host; we can never rewrite these inner frames
         └─ Cloudflare Turnstile → <video>
```

### Fact 1 — the `sandbox` attribute can never work here

The player host ships `sbx.js` in the inner frames (loaded straight from
their servers — un-strippable by our proxy). Its detection includes:

```js
try { document.domain = document.domain; }
catch (t) { if (t.toString().toLowerCase().includes('sandbox')) redirectToDeadPage(); }
```

Per the HTML spec, assigning `document.domain` in a sandboxed document throws
a `SecurityError` **unconditionally** — sandbox flags propagate into every
nested browsing context and *no token combination relaxes this* (the once-
believed `allow-same-origin` exemption is false in current browsers; verified
empirically June 2026, every token set → dead player). This is a hard
constraint, not a tuning problem.

### Fact 2 — the old sandbox never provided origin isolation anyway

The previous design was `sandbox="allow-scripts allow-same-origin"` on
proxied HTML served from the app's own origin. That combination is
self-defeating: the embedded scripts ran same-origin with the app (full DOM /
storage / cookie access) and could even reach `parent.document` and remove
the sandbox attribute themselves. The sandbox's only real contribution was
blocking popups and top-level navigation. So "restore the sandbox" was never
the right goal — "restore (actually: *establish*) isolation" was.

### Fact 3 — the fullscreen bug was a resource-resolution casualty of the proxy

Serving third-party HTML from our origin broke its root-relative URLs. No
stylesheet → `html`/`body` have no height → the player iframe's
`height: 100%` collapses to the 150px default. Hypotheses rejected along the
way, kept here so nobody re-litigates them: it was never the Fullscreen API
(`fullscreenEnabled` is true in every frame), and permutations of
`allow`/`allowfullscreen` on the iframe have **no observable effect** — don't
iterate on them again.

## Decisions

### D1 — Fix layout by injecting `<base href>` (not by rewriting URLs)

`injectBaseHref(html, finalUrl)` in `packages/server/src/embedHandlers.ts`
adds `<base href="<final upstream URL after redirects>">` to the cleaned
HTML. One tag fixes *all* relative resolution (stylesheets, scripts, the
protocol-relative player iframe — which also upgrades from http to https),
and it keeps working when vidsrc rotates mirror domains because it uses
`response.url`, the post-redirect URL. Rewriting individual URLs server-side
was rejected as a fragile enumeration of an upstream page we don't control.

### D2 — Remove the `sandbox` attribute (forced by Fact 1)

Not a preference — there is no sandbox token set under which the player
loads. Kept on the iframe: `allow="fullscreen; picture-in-picture"`,
`allowfullscreen`, `referrerpolicy="no-referrer"`.

### D3 — Serve the embed proxy from a dedicated origin

The isolation the sandbox was *meant* to provide now comes from the
same-origin policy, which — unlike a sandbox flag — embedded JS can neither
detect (no `document.domain` tell-tale, so `sbx.js` is blind to it) nor
escape:

- **Server** — a second Hono listener on `EMBED_PORT` (default **8081**)
  serves *only* `/api/embed`. The route is **removed from the main API app**:
  `:8080/api/embed` returns 404, so the third-party HTML cannot be served
  same-origin with the app even by mistake.
- **Client** — `CONFIG.EMBED_ORIGIN` (default
  `<protocol>//<hostname>:8081`, build-time override `VITE_EMBED_ORIGIN`);
  `getEmbedUrl` returns an absolute URL on that origin.
- **Docker** — nginx exposes the embed listener on container port 81;
  documented run flags publish it as host 8081 (`-p 8080:80 -p 8081:81`).

### Security: before vs after

| Capability of hostile embed JS | old `sandbox` + same-origin proxy | now (separate origin, no sandbox) |
| --- | --- | --- |
| Read/modify app DOM | ✅ possible (same-origin + `allow-same-origin`) | ❌ blocked (SOP) |
| Read app storage/cookies | ✅ possible | ❌ blocked (SOP) |
| Remove its own restrictions | ✅ possible (strip `sandbox` via `parent.document`) | ❌ nothing to strip; SOP is not an attribute |
| Detectable by `sbx.js` (kills player) | ✅ detected → **dead player** | ❌ undetectable |
| Open popups (with user gesture) | ❌ blocked | ⚠️ possible — accepted residual |
| Navigate top page (with user gesture) | ❌ blocked | ⚠️ possible — accepted residual |
| Camera/mic/geolocation/etc. | ❌ blocked (`allow` list) | ❌ blocked (`allow` list) |

The residual (popup / top-nav with a user gesture) is annoyance-grade, not
data-theft-grade, and **no mechanism can block it without killing the
player** — `sandbox` is the only web platform feature that gates those, and
`sandbox` is off the table by Fact 1. Everything else from the original
hardening remains: origin-pinned `isAllowedEmbedUrl` (no open proxy),
`cleanEmbedHtml` script stripping, minimal `allow` list, `no-referrer`,
no-op `postMessage` listener, no client-side secrets.

## Why a new port (8081)?

An origin is the triple **(scheme, host, port)**. Isolation requires the
embed to differ from the app in at least one component. Going through them:

- **Scheme** — not differentiable (both are http in dev / https in prod).
- **Host** — a subdomain (`embed.example.com`) gives a separate origin on
  the *same* port. This is the right answer **when you own a DNS name**, and
  the implementation already supports it: point `VITE_EMBED_ORIGIN` at the
  subdomain and route it to the embed listener in your reverse proxy. But
  this repo's documented deployment is hobby-grade `docker run -p` addressed
  by IP:port, and dev is plain `localhost` — no DNS to lean on. (A
  `*.localhost` hack works in modern browsers but not as a prod story.)
- **Port** — always available, zero external dependencies. Hence 8081.

Alternatives that would have avoided the second port, and why they lose:

1. **Keep `/api/embed` on the app origin** (status quo ante) — no isolation
   at all; this is the hole being fixed.
2. **Reuse the existing API origin (`:8080`) as the embed origin** — works
   in dev (the app is on `:3000`, so `:8080` is already cross-origin), but
   collapses in prod where nginx serves the SPA *and* proxies `/api/` on one
   origin — embed JS would be same-origin with the app exactly where it
   matters. It would also put third-party JS same-origin with the whole API
   surface. A dedicated listener whose only route is `/api/embed` is both a
   consistent dev/prod rule and a minimal attack surface.
3. **Opaque-origin tricks** (fetch the cleaned HTML client-side, load it via
   a `data:` URL iframe) — technically a distinct origin without any port,
   but it trades a boring port for a pile of fragile semantics: opaque-origin
   documents get `Origin: null` fetches, throwing `localStorage`, browser-
   specific `data:`-frame quirks — any of which the upstream scripts may
   trip over today or after their next deploy. Unverifiable-by-design;
   rejected.
4. **Any `sandbox` variant** — dead on arrival (Fact 1); empirically
   re-verified, do not retry.

**Conclusion: there is no no-compromises way to avoid the extra port** under
this repo's IP:port deployment model. The port *is* the compromise-free
option among the real candidates; deployments with DNS can trade it for a
subdomain via `VITE_EMBED_ORIGIN` without touching code.

## Consequences

- ✅ Player works: correct size, full playback chain, fullscreen enabled in
  every frame.
- ✅ Stronger isolation than the project has ever actually had (see table).
- ✅ Mirror-domain rotation tolerated automatically (`<base>` uses the
  post-redirect URL).
- ⚠️ Deployments must now publish a second port (or configure a subdomain);
  `docker run` without `-p 8081:81` yields a black player box — the iframe
  points at an unreachable origin.
- ⚠️ HTTPS deployments must terminate TLS for the embed origin too (the
  client default inherits the page's scheme).
- ⚠️ Popups/top-nav with a user gesture remain possible (accepted residual,
  documented in the server README).

## Verification record (2026-06-09, Playwright/Chromium against `npm run dev`)

- Outer iframe loads `http://localhost:8081/api/embed?...`; embed document
  reports `window.origin === "http://localhost:8081"`.
- Inside the embed frame, `window.parent.document` throws `SecurityError`
  → isolation is real, not declared.
- `#player_iframe` measures **1168×657** (vs the 150px strip); `style.css`
  confirmed loaded.
- rcp frame stays on `/rcp/` (no `sbx.html` redirect); play click loads
  `/prorcp/` and the Turnstile widget; `document.fullscreenEnabled === true`
  in every frame of the chain.
- `http://localhost:8080/api/embed` returns **404**.
- 32/32 unit tests, `tsc`, `eslint`, `prettier` all pass.

Standing caveats for anyone re-verifying: headless automation cannot pass
Turnstile (API-level fullscreen only), and Playwright-Firefox cannot deliver
fullscreen verdicts at all (its synthetic clicks grant no user activation in
cross-origin frames — denials there are harness artifacts, not browser
behavior). Probe recipe: with `npm run dev` up, drive Playwright/Chromium to
`/tv/85552?season=1&episode=7`, wait ~10s, click `#pl_but` in the `/rcp/`
frame, wait ~8s, then inspect frames for origin, `#player_iframe` size, and
`document.fullscreenEnabled`. A black player box with a 404 in the network
tab means the embed origin (8081) isn't published/reachable.

## Change map

| File | Change |
| --- | --- |
| `packages/server/src/embedHandlers.ts` | `injectBaseHref` + `finalUrl` on `EmbedResult`; corrected `sbx.js` comment |
| `packages/client/src/pages/{Show,Movie}DetailPage.vue` | removed the `sandbox` attribute (only) |
| `packages/server/src/index.ts` | dedicated embed listener; `/api/embed` removed from the main app |
| `packages/server/src/config.ts` | `EMBED_PORT` (default 8081) |
| `packages/client/src/config.ts` | `EMBED_ORIGIN` + absolute `getEmbedUrl` |
| `nginx.conf`, `Dockerfile`, root `package.json` | embed origin on container port 81, published as 8081 |
| `packages/server/README.md` | "Origin isolation", rewritten "Sandbox tradeoffs", "`<base href>` injection" |
| `DEBUGGING.md` | working diagnosis log — deleted; superseded by this ADR |
