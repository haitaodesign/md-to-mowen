import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MowenClient, MowenApiError, Visibility } from '../../src/mowen/client.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('MowenClient', () => {
  const client = new MowenClient('test-api-key');

  describe('setPrivacy', () => {
    it('正确调用隐私设置 API（public）', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await client.setPrivacy('note-123', 'public');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://open.mowen.cn/api/open/api/v1/note/settings');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({
        noteId: 'note-123',
        section: 1,
        settings: {
          privacy: {
            type: 'public',
          },
        },
      });
    });

    it('正确调用隐私设置 API（private）', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await client.setPrivacy('note-456', 'private');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://open.mowen.cn/api/open/api/v1/note/settings');
      expect(JSON.parse(options.body)).toEqual({
        noteId: 'note-456',
        section: 1,
        settings: {
          privacy: {
            type: 'private',
          },
        },
      });
    });

    it('API 返回错误时抛出 MowenApiError', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ code: 404, reason: '笔记不存在' }),
      });

      await expect(client.setPrivacy('invalid-note', 'public')).rejects.toThrow('[404] 笔记不存在');
    });

    it('API 返回业务错误时抛出 MowenApiError', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 40001, reason: '无权限操作该笔记' }),
      });

      await expect(client.setPrivacy('note-other', 'private')).rejects.toThrow('[40001] 无权限操作该笔记');
    });
  });
});
