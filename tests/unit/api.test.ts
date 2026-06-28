import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MowenAPI } from '../../src/core/api.js';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('MowenAPI', () => {
  let api: MowenAPI;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MOWEN_API_KEY = 'test-api-key';
    api = new MowenAPI();
  });

  describe('createNote', () => {
    it('should create note successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ noteId: 'test-note-id' }),
      });

      const body = { type: 'doc' as const, content: [] };
      const result = await api.createNote(body);

      expect(result).toEqual({ noteId: 'test-note-id' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://open.mowen.cn/api/open/api/v1/note/create',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer test-api-key',
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should throw error when API key is not set', async () => {
      delete process.env.MOWEN_API_KEY;
      api = new MowenAPI();

      const body = { type: 'doc' as const, content: [] };
      await expect(api.createNote(body)).rejects.toThrow('MOWEN_API_KEY is not set');
    });

    it('should throw error when API returns error', async () => {
      // Mock all retry attempts
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ reason: 'Invalid request' }),
      });

      const body = { type: 'doc' as const, content: [] };
      await expect(api.createNote(body)).rejects.toThrow('API error: Invalid request');
    });
  });

  describe('editNote', () => {
    it('should edit note successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const body = { type: 'doc' as const, content: [] };
      await expect(api.editNote('note-id', body)).resolves.toBeUndefined();
    });
  });

  describe('setPrivacy', () => {
    it('should set privacy successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await expect(api.setPrivacy('note-id', 'private')).resolves.toBeUndefined();
    });
  });

  describe('resetApiKey', () => {
    it('should reset API key successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ apiKey: 'new-api-key' }),
      });

      const result = await api.resetApiKey();
      expect(result).toEqual({ apiKey: 'new-api-key' });
    });

    it('should throw error when reset fails', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ reason: 'Unauthorized' }),
      });

      await expect(api.resetApiKey()).rejects.toThrow('API error: Unauthorized');
    });
  });
});
