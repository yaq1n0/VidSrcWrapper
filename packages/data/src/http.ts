export class HttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly body?: string;
  readonly headers: Record<string, string>;

  constructor(params: {
    message?: string;
    status: number;
    statusText: string;
    url: string;
    body?: string;
    headers: Record<string, string>;
  }) {
    super(
      params.message ||
        `HTTP ${params.status} ${params.statusText} for ${params.url}`
    );
    this.name = 'HttpError';
    this.status = params.status;
    this.statusText = params.statusText;
    this.url = params.url;
    this.body = params.body;
    this.headers = params.headers;
  }
}

export interface IHttpClient {
  /**
   * Performs a GET request and parses the response as JSON of type T.
   */
  getJson<T>(url: string | URL, init?: Omit<RequestInit, 'method'>): Promise<T>;

  /**
   * Generic request returning the raw Response for advanced scenarios.
   */
  request(url: string | URL, init?: RequestInit): Promise<Response>;
}

export function createFetchHttpClient(
  fetchFn: typeof fetch = globalThis.fetch.bind(globalThis)
): IHttpClient {
  if (typeof fetchFn !== 'function') {
    throw new Error(
      'No fetch implementation available. Provide one to createFetchHttpClient.'
    );
  }

  const toUrlString = (input: string | URL): string =>
    typeof input === 'string' ? input : input.toString();

  async function request(
    url: string | URL,
    init?: RequestInit
  ): Promise<Response> {
    return fetchFn(url, init);
  }

  async function getJson<T>(
    url: string | URL,
    init?: Omit<RequestInit, 'method'>
  ): Promise<T> {
    const response = await request(url, { ...(init || {}), method: 'GET' });
    if (!response.ok) {
      let bodyText = '';
      try {
        bodyText = await response.text();
      } catch {
        /* ignore */
      }
      const headerEntries = (() => {
        try {
          return Object.fromEntries(response.headers.entries());
        } catch {
          return {} as Record<string, string>;
        }
      })();
      throw new HttpError({
        status: response.status,
        statusText: response.statusText,
        url: toUrlString(url),
        body: bodyText,
        headers: headerEntries,
      });
    }
    return (await response.json()) as T;
  }

  return { getJson, request } satisfies IHttpClient;
}

// Singleton with override for app/tests
let singletonClient: IHttpClient | null = null;

export function getHttpClient(): IHttpClient {
  if (!singletonClient) {
    singletonClient = createFetchHttpClient();
  }
  return singletonClient;
}

export function setHttpClient(client: IHttpClient): void {
  singletonClient = client;
}

// Convenience export for typical usage
// Intentionally do not export a constant instance to allow swapping via setHttpClient

// A simple mock client to aid unit testing
export class MockHttpClient implements IHttpClient {
  // Map of URL (string) to either static JSON value or async function
  private handlers: Map<
    string,
    unknown | ((url: string, init?: RequestInit) => unknown | Promise<unknown>)
  > = new Map();

  on(
    url: string,
    handler:
      | unknown
      | ((url: string, init?: RequestInit) => unknown | Promise<unknown>)
  ): this {
    this.handlers.set(url, handler);
    return this;
  }

  async request(url: string | URL, _init?: RequestInit): Promise<Response> {
    const key = typeof url === 'string' ? url : url.toString();
    if (!this.handlers.has(key)) {
      return new Response(null, { status: 404, statusText: 'Not Found' });
    }
    const handler = this.handlers.get(key)!;
    const data =
      typeof handler === 'function' ? await (handler as any)(key) : handler;
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getJson<T>(url: string | URL): Promise<T> {
    const res = await this.request(url, { method: 'GET' });
    if (!res.ok) {
      throw new HttpError({
        status: res.status,
        statusText: res.statusText,
        url: typeof url === 'string' ? url : url.toString(),
        headers: {},
      });
    }
    return (await res.json()) as T;
  }
}
