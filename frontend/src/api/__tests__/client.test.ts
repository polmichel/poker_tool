/**
 * API Client Tests
 *
 * Tests the shared HTTP client configuration: base URL, the auth-token request
 * interceptor, and the response interceptor that clears the token on 401.
 *
 * Note: axios-mock-adapter runs requests through the axios instance's
 * interceptors, so these tests exercise the real interceptor chain on `api`.
 */
import MockAdapter from 'axios-mock-adapter';
import { api, API_BASE_URL, isApiError, isUnauthorizedError } from '../client';

describe('API Client Configuration', () => {
  describe('Configuration', () => {
    it('should have the correct base URL', () => {
      expect(API_BASE_URL).toBe('http://localhost:5000/api');
    });
  });

  describe('Request interceptor', () => {
    let mockAxios: MockAdapter;

    beforeEach(() => {
      mockAxios = new MockAdapter(api);
      localStorage.clear();
    });

    afterEach(() => {
      mockAxios.restore();
      localStorage.clear();
    });

    it('attaches the bearer token to requests when one is stored', async () => {
      localStorage.setItem('poker_tool_token', 'test-token');
      mockAxios.onGet('/test').reply(200, { data: 'test' });

      const response = await api.get('/test');
      expect(response.config.headers?.Authorization).toBe('Bearer test-token');
    });

    it('does not attach an Authorization header when no token is stored', async () => {
      mockAxios.onGet('/test').reply(200, { data: 'test' });

      await api.get('/test');
      expect(mockAxios.history.get[0].headers?.Authorization).toBeUndefined();
    });
  });

  describe('Response interceptor', () => {
    let mockAxios: MockAdapter;

    beforeEach(() => {
      mockAxios = new MockAdapter(api);
      localStorage.clear();
    });

    afterEach(() => {
      mockAxios.restore();
      localStorage.clear();
    });

    it('clears the token on a 401 response', async () => {
      localStorage.setItem('poker_tool_token', 'test-token');
      mockAxios.onGet('/test').reply(401, { message: 'Unauthorized' });

      try {
        await api.get('/test');
      } catch {
        // Expected
      }
      expect(localStorage.getItem('poker_tool_token')).toBeNull();
    });

    it('standardizes errors as ApiError with a status field', async () => {
      mockAxios.onGet('/test').reply(500, { message: 'Server boom' });

      let caught: unknown;
      try {
        await api.get('/test');
      } catch (_err) {
        caught = err;
      }
      expect(isApiError(caught)).toBe(true);
      expect(isUnauthorizedError(caught)).toBe(false);
      expect((caught as Error).message).toBe('Server boom');
    });

    it('marks a 401 error as unauthorized', async () => {
      mockAxios.onGet('/test').reply(401, { message: 'Unauthorized' });

      let caught: unknown;
      try {
        await api.get('/test');
      } catch (_err) {
        caught = err;
      }
      expect(isUnauthorizedError(caught)).toBe(true);
    });

    it('does not clear the token on a non-401 error', async () => {
      localStorage.setItem('poker_tool_token', 'still-here');
      mockAxios.onGet('/test').reply(500, { message: 'boom' });

      try {
        await api.get('/test');
      } catch {
        // Expected
      }
      expect(localStorage.getItem('poker_tool_token')).toBe('still-here');
    });
  });
});
