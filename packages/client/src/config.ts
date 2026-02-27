export type ClientConfig = {
  VIDSRC_BASE_URL: string;
};

export const CONFIG: ClientConfig = {
  VIDSRC_BASE_URL: 'https://vsrc.su', // this should match up with /server/src/config.ts's VIDSRC_BASE_URL or it will get rejected.
};

export const getEmbedUrl = (vidsrcUrl: string): string =>
  `/api/embed?url=${encodeURIComponent(vidsrcUrl)}`;
