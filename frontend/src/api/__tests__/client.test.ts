/**
 * API Client Tests
 * Tests for the shared HTTP client configuration
 */
import { API_BASE_URL } from '../client';

describe('API Client Configuration', () => {
  describe('Configuration', () => {
    it('should have the correct base URL', () => {
      expect(API_BASE_URL).toBe('http://localhost:5000/api');
    });
  });
});
