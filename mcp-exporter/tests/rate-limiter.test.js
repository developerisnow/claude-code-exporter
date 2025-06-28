import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { RateLimiter } from '../index.js';

describe('RateLimiter', () => {
  let rateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter(3, 1000); // 3 requests per second for testing
  });

  it('should allow requests within limit', () => {
    expect(() => rateLimiter.checkLimit('client1')).not.toThrow();
    expect(() => rateLimiter.checkLimit('client1')).not.toThrow();
    expect(() => rateLimiter.checkLimit('client1')).not.toThrow();
  });

  it('should block requests exceeding limit', () => {
    // Use up the limit
    rateLimiter.checkLimit('client1');
    rateLimiter.checkLimit('client1');
    rateLimiter.checkLimit('client1');

    // This should throw
    expect(() => rateLimiter.checkLimit('client1')).toThrow(/Rate limit exceeded/);
  });

  it('should track different clients separately', () => {
    // Client 1 uses up their limit
    rateLimiter.checkLimit('client1');
    rateLimiter.checkLimit('client1');
    rateLimiter.checkLimit('client1');
    expect(() => rateLimiter.checkLimit('client1')).toThrow();

    // Client 2 should still be able to make requests
    expect(() => rateLimiter.checkLimit('client2')).not.toThrow();
    expect(() => rateLimiter.checkLimit('client2')).not.toThrow();
  });

  it('should reset after time window', async () => {
    // Use up the limit
    rateLimiter.checkLimit('client1');
    rateLimiter.checkLimit('client1');
    rateLimiter.checkLimit('client1');
    expect(() => rateLimiter.checkLimit('client1')).toThrow();

    // Wait for window to pass
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Should be able to make requests again
    expect(() => rateLimiter.checkLimit('client1')).not.toThrow();
  });

  it('should clean up old entries', () => {
    // Make some requests
    rateLimiter.checkLimit('client1');
    rateLimiter.checkLimit('client2');

    // Wait for window to pass
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now + 2000);

    // Make new request - old entries should be cleaned
    rateLimiter.checkLimit('client1');

    // Verify cleanup happened (implementation detail test)
    const requests = rateLimiter.requests.get('client1');
    expect(requests.length).toBe(1);
    expect(requests[0]).toBeGreaterThan(now);
  });

  it('should provide meaningful error message with reset time', () => {
    // Use up the limit
    const startTime = Date.now();
    rateLimiter.checkLimit('client1');
    rateLimiter.checkLimit('client1');
    rateLimiter.checkLimit('client1');

    try {
      rateLimiter.checkLimit('client1');
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error.message).toMatch(/Rate limit exceeded/);
      expect(error.message).toMatch(/Try again after/);
      expect(error.message).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO date format
    }
  });
});