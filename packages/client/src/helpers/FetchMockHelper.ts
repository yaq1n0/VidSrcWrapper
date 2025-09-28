import { vi, type MockedFunction } from 'vitest';

interface MockResponse<T> {
  status: number;
  statusText: string;
  ok: boolean;
  json(): Promise<T>;
  text(): Promise<string>;
}

export class FetchMockHelper {
  private mockFetch: MockedFunction<typeof fetch>;

  constructor() {
    this.mockFetch = vi.fn();
    vi.stubGlobal('fetch', this.mockFetch);
  }

  /**
   * Mock the next fetch call to return JSON data
   */
  mockNextJsonResponse<T>(
    expectedUrl: string,
    responseData: T,
    status: number = 200
  ): void {
    const mockResponse: MockResponse<T> = {
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      ok: status >= 200 && status < 300,
      json: vi.fn().mockResolvedValue(responseData),
      text: vi.fn().mockResolvedValue(JSON.stringify(responseData)),
    };

    this.mockFetch.mockImplementationOnce(async input => {
      const url = input.toString();
      if (url !== expectedUrl) {
        throw new Error(`Expected fetch to ${expectedUrl}, but got ${url}`);
      }
      return mockResponse as unknown as Response;
    });
  }

  /**
   * Mock the next fetch call to return an error
   */
  mockNextError(
    expectedUrl: string,
    status: number,
    errorMessage: string
  ): void {
    const mockResponse: MockResponse<never> = {
      status,
      statusText: errorMessage,
      ok: false,
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      text: vi.fn().mockResolvedValue(errorMessage),
    };

    this.mockFetch.mockImplementationOnce(async input => {
      const url = input.toString();
      if (url !== expectedUrl) {
        throw new Error(`Expected fetch to ${expectedUrl}, but got ${url}`);
      }
      return mockResponse as unknown as Response;
    });
  }

  /**
   * Restore the original fetch function
   */
  restore(): void {
    vi.unstubAllGlobals();
  }

  /**
   * Clear all mock implementations
   */
  clear(): void {
    this.mockFetch.mockReset();
  }
}

/**
 * Create a new FetchMockHelper instance for testing
 */
export function createFetchMock(): FetchMockHelper {
  return new FetchMockHelper();
}
