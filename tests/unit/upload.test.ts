import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadImage } from '../../src/core/upload.js';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(Buffer.from('test image data')),
}));

describe('uploadImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MOWEN_API_KEY = 'test-api-key';
  });

  it('should upload image successfully', async () => {
    // Mock prepare response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          form: {
            endpoint: 'https://oss.example.com/upload',
            key: 'test-key',
            policy: 'test-policy',
            callback: 'test-callback',
            success_action_status: '200',
            'x-oss-credential': 'test-cred',
            'x-oss-date': '2024-01-01',
            'x-oss-meta-mo-uid': 'test-uid',
            'x-oss-signature': 'test-sig',
            'x-oss-signature-version': 'v4',
            'x:file_id': 'test-file-id-TMP',
            'x:file_uid': 'test-file-uid',
          },
        }),
    });

    // Mock upload response
    mockFetch.mockResolvedValueOnce({
      ok: true,
    });

    const result = await uploadImage('/path/to/image.png');

    expect(result).toEqual({
      fileId: 'test-file-id-TMP',
      fileName: 'image.png',
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://open.mowen.cn/api/open/api/v1/upload/prepare',
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

    await expect(uploadImage('/path/to/image.png')).rejects.toThrow('MOWEN_API_KEY is not set');
  });

  it('should throw error when prepare fails', async () => {
    // Mock all retry attempts
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    await expect(uploadImage('/path/to/image.png')).rejects.toThrow(
      'Upload prepare failed: 401 Unauthorized'
    );
  });

  it('should throw error when prepare returns error code', async () => {
    // Mock all retry attempts
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ code: 400, message: 'Invalid request' }),
    });

    await expect(uploadImage('/path/to/image.png')).rejects.toThrow('Upload prepare error');
  });
});
