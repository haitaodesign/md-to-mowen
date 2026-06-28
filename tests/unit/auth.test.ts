import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAuth } from '../../src/core/auth.js';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('checkAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MOWEN_API_KEY = 'test-api-key';
  });

  it('should return authorized when API key is valid', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
    });

    const result = await checkAuth();
    expect(result.authorized).toBe(true);
    expect(result.requester).toBe('authenticated');
  });

  it('should return unauthorized when API key is invalid', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const result = await checkAuth();
    expect(result.authorized).toBe(false);
    expect(result.message).toContain('401');
  });

  it('should return unauthorized when API key is not set', async () => {
    delete process.env.MOWEN_API_KEY;

    const result = await checkAuth();
    expect(result.authorized).toBe(false);
    expect(result.message).toContain('not set');
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await checkAuth();
    expect(result.authorized).toBe(false);
    expect(result.message).toContain('Network error');
  });
});
