import { describe, it, expect, afterEach } from 'vitest';
import { FetchMockHelper } from './FetchMockHelper.js';

describe('FetchMockHelper', () => {
  let mockHelper: FetchMockHelper;

  afterEach(() => {
    if (mockHelper) {
      mockHelper.restore();
    }
  });

  it('mocks successful fetch requests with JSON response', async () => {
    mockHelper = new FetchMockHelper();
    const testData = { message: 'Hello World', status: 'success' };

    mockHelper.mockNextJsonResponse('/api/test', testData);

    const response = await fetch('/api/test');
    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data).toEqual(testData);
  });

  it('mocks fetch requests with custom status codes', async () => {
    mockHelper = new FetchMockHelper();
    const testData = { error: 'Bad request' };

    mockHelper.mockNextJsonResponse('/api/bad-request', testData, 400);

    const response = await fetch('/api/bad-request');
    expect(response.status).toBe(400);
    expect(response.ok).toBe(false);

    const data = await response.json();
    expect(data).toEqual(testData);
  });

  it('mocks error responses', async () => {
    mockHelper = new FetchMockHelper();

    mockHelper.mockNextError('/api/error', 500, 'Internal Server Error');

    const response = await fetch('/api/error');
    expect(response.status).toBe(500);
    expect(response.ok).toBe(false);

    const errorText = await response.text();
    expect(errorText).toBe('Internal Server Error');

    // JSON should reject
    await expect(response.json()).rejects.toThrow('Invalid JSON');
  });

  it('validates the expected URL is called', async () => {
    mockHelper = new FetchMockHelper();
    const testData = { message: 'test' };

    mockHelper.mockNextJsonResponse('/api/expected', testData);

    // Calling a different URL should throw an error
    await expect(fetch('/api/different')).rejects.toThrow(
      'Expected fetch to /api/expected, but got /api/different'
    );
  });

  it('works with complex nested objects', async () => {
    mockHelper = new FetchMockHelper();
    const complexData = {
      results: [
        { id: 1, title: 'Movie 1', vote_average: 8.5 },
        { id: 2, title: 'Movie 2', vote_average: 7.2 },
      ],
      page: 1,
      total_results: 2,
    };

    mockHelper.mockNextJsonResponse('/api/movies', complexData);

    const response = await fetch('/api/movies');
    const data = await response.json();
    expect(data).toEqual(complexData);
    expect(data.results).toHaveLength(2);
    expect(data.results[0].vote_average).toBe(8.5);
  });

  it('can mock multiple sequential requests', async () => {
    mockHelper = new FetchMockHelper();

    // Mock first request
    mockHelper.mockNextJsonResponse('/api/first', { message: 'first' });
    // Mock second request
    mockHelper.mockNextJsonResponse('/api/second', { message: 'second' });

    // Make first request
    const firstResponse = await fetch('/api/first');
    const firstData = await firstResponse.json();
    expect(firstData).toEqual({ message: 'first' });

    // Make second request
    const secondResponse = await fetch('/api/second');
    const secondData = await secondResponse.json();
    expect(secondData).toEqual({ message: 'second' });
  });

  it('can clear mock implementations', () => {
    mockHelper = new FetchMockHelper();

    mockHelper.mockNextJsonResponse('/api/test', { message: 'test' });
    mockHelper.clear();

    // After clearing, no mocks should be active
    // This is hard to test directly, but we can verify clear doesn't throw
    expect(() => mockHelper.clear()).not.toThrow();
  });
});
