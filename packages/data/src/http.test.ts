import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  HttpError,
  IHttpClient,
  createFetchHttpClient,
  getHttpClient,
  setHttpClient,
  MockHttpClient,
} from './http.js';

describe('HttpError', () => {
  it('generates default message when none provided', () => {
    const error = new HttpError({
      status: 404,
      statusText: 'Not Found',
      url: 'https://api.example.com/test',
      headers: {},
    });

    expect(error.message).toBe(
      'HTTP 404 Not Found for https://api.example.com/test'
    );
  });

  it('uses custom message when provided', () => {
    const error = new HttpError({
      message: 'Custom error message',
      status: 500,
      statusText: 'Internal Server Error',
      url: 'https://api.example.com/test',
      headers: {},
    });

    expect(error.message).toBe('Custom error message');
  });
});

describe('createFetchHttpClient', () => {
  const setupMocks = () => {
    const mockFetch = vi.fn();
    const client = createFetchHttpClient(mockFetch);
    return { mockFetch, client };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws if no fetch implementation provided', () => {
    expect(() => createFetchHttpClient(null as never)).toThrow(
      'No fetch implementation available. Provide one to createFetchHttpClient.'
    );
  });

  it('throws if non-function is provided', () => {
    expect(() => createFetchHttpClient('not a function' as never)).toThrow(
      'No fetch implementation available. Provide one to createFetchHttpClient.'
    );
  });

  it('makes GET request and parses JSON response', async () => {
    const { mockFetch, client } = setupMocks();
    const responseData = { id: 1, name: 'Test' };
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(responseData),
    };
    mockFetch.mockResolvedValue(mockResponse);

    const result = await client.getJson('https://api.example.com/test', {
      headers: { Authorization: 'Bearer token' },
    });

    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', {
      headers: { Authorization: 'Bearer token' },
      method: 'GET',
    });
    expect(result).toEqual(responseData);
  });

  it('converts failed responses to HttpError with response details', async () => {
    const { mockFetch, client } = setupMocks();
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: vi.fn().mockResolvedValue('Resource not found'),
      headers: new Map([['content-type', 'text/plain']]),
    };
    mockFetch.mockResolvedValue(mockResponse);

    await expect(
      client.getJson('https://api.example.com/missing')
    ).rejects.toThrow(HttpError);

    try {
      await client.getJson('https://api.example.com/missing');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(404);
      expect((error as HttpError).body).toBe('Resource not found');
      expect((error as HttpError).headers).toEqual({
        'content-type': 'text/plain',
      });
    }
  });

  it('handles failures gracefully when reading error response', async () => {
    const { mockFetch, client } = setupMocks();
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: vi.fn().mockRejectedValue(new Error('Failed to read body')),
      headers: {
        entries: vi.fn().mockImplementation(() => {
          throw new Error('Headers unavailable');
        }),
      },
    };
    mockFetch.mockResolvedValue(mockResponse);

    try {
      await client.getJson('https://api.example.com/error');
    } catch (error) {
      expect((error as HttpError).body).toBe('');
      expect((error as HttpError).headers).toEqual({});
    }
  });
  it('passes through raw requests unchanged', async () => {
    const { mockFetch, client } = setupMocks();
    const mockResponse = { ok: true, status: 200 };
    mockFetch.mockResolvedValue(mockResponse);

    const init = { method: 'POST', body: '{"data":"test"}' };
    const result = await client.request('https://api.example.com/post', init);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/post',
      init
    );
    expect(result).toBe(mockResponse);
  });
});

describe('singleton management', () => {
  it('creates and reuses same instance', () => {
    const client1 = getHttpClient();
    const client2 = getHttpClient();
    expect(client1).toBe(client2);
  });

  it('allows overriding singleton for testing', () => {
    const mockClient: IHttpClient = {
      getJson: vi.fn(),
      request: vi.fn(),
    };

    setHttpClient(mockClient);
    const mockedClient = getHttpClient();
    expect(mockedClient).toBe(mockClient);
  });
});

describe('MockHttpClient', () => {
  let mockClient: MockHttpClient;

  beforeEach(() => {
    mockClient = new MockHttpClient();
  });

  it('returns 404 for unregistered URLs', async () => {
    const response = await mockClient.request(
      'https://api.example.com/unknown'
    );
    expect(response.status).toBe(404);
  });

  it('returns mocked responses for registered URLs', async () => {
    const testData = { id: 1, name: 'Test' };
    mockClient.on('https://api.example.com/test', testData);

    const result = await mockClient.getJson('https://api.example.com/test');
    expect(result).toEqual(testData);
  });

  it('supports dynamic responses via function handlers', async () => {
    const handler = vi.fn(url => ({ url, timestamp: Date.now() }));
    mockClient.on('https://api.example.com/dynamic', handler);

    const result = await mockClient.getJson<{ url: string; timestamp: number }>(
      'https://api.example.com/dynamic'
    );
    expect(handler).toHaveBeenCalledWith('https://api.example.com/dynamic');
    expect(result.url).toBe('https://api.example.com/dynamic');
  });

  it('throws HttpError for 404 responses in getJson', async () => {
    await expect(
      mockClient.getJson('https://api.example.com/missing')
    ).rejects.toThrow(HttpError);
  });
});

describe('end-to-end behavior', () => {
  it('preserves complete error information in real usage', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      text: vi.fn().mockResolvedValue('{"error": "validation failed"}'),
      headers: new Map([
        ['content-type', 'application/json'],
        ['x-error-code', 'VALIDATION_ERROR'],
      ]),
    });

    const client = createFetchHttpClient(mockFetch);

    try {
      await client.getJson('https://api.example.com/validate');
    } catch (error) {
      const httpError = error as HttpError;
      expect(httpError.status).toBe(422);
      expect(httpError.body).toBe('{"error": "validation failed"}');
      expect(httpError.headers).toEqual({
        'content-type': 'application/json',
        'x-error-code': 'VALIDATION_ERROR',
      });
    }
  });
});
