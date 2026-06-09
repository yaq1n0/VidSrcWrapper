export type ClientConfig = {
  VIDSRC_BASE_URL: string;
  EMBED_ORIGIN: string;
};

// The embed proxy is served from its own origin (a separate port) so the
// third-party embed JS never runs same-origin with the app — this replaces the
// iframe sandbox attribute, which the player's sbx.js detects and kills under
// every token combination. See packages/server/README.md "Sandbox tradeoffs".
// Default assumes the embed listener is published on port 8081 of the same
// host (true for `npm run dev` and the documented docker run flags); override
// with VITE_EMBED_ORIGIN at build time for other deployments.
const defaultEmbedOrigin = (): string =>
  `${window.location.protocol}//${window.location.hostname}:8081`;

export const CONFIG: ClientConfig = {
  VIDSRC_BASE_URL: 'https://vsrc.su', // this should match up with /server/src/config.ts's VIDSRC_BASE_URL or it will get rejected.
  EMBED_ORIGIN: import.meta.env.VITE_EMBED_ORIGIN || defaultEmbedOrigin(),
};

export const getEmbedUrl = (vidsrcUrl: string): string =>
  `${CONFIG.EMBED_ORIGIN}/api/embed?url=${encodeURIComponent(vidsrcUrl)}`;
