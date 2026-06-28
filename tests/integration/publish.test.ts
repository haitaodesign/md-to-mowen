import { describe, it, expect, vi, beforeEach } from 'vitest';
import { publish } from '../../src/commands/publish.js';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Mock dependencies
vi.mock('../../src/core/upload.js', () => ({
  uploadImage: vi.fn().mockResolvedValue({ fileId: 'test-file-id', fileName: 'test.png' }),
}));

vi.mock('../../src/core/api.js', () => ({
  MowenAPI: vi.fn().mockImplementation(() => ({
    createNote: vi.fn().mockResolvedValue({ noteId: 'test-note-id' }),
  })),
}));

describe('publish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MOWEN_API_KEY = 'test-api-key';
  });

  it('should publish article successfully', async () => {
    // Create temp file
    const tempDir = join(tmpdir(), 'mowen-test');
    mkdirSync(tempDir, { recursive: true });
    const tempFile = join(tempDir, 'test.md');

    writeFileSync(
      tempFile,
      `# 测试文章

这是一篇测试文章，包含足够的字数来通过长度检查。我们需要写更多的内容来确保文章长度能够满足要求。

![image](test.png)

## 第二部分

这里是第二部分的内容。我们继续添加更多的文字来确保整篇文章的长度能够达到最低要求。这样可以避免长度检查失败。`
    );

    try {
      const result = await publish(tempFile);
      expect(result.noteId).toBe('test-note-id');
      expect(result.url).toBe('https://mowen.cn/note/test-note-id');
    } finally {
      unlinkSync(tempFile);
    }
  });

  it('should throw error when quality check fails', async () => {
    // Create temp file
    const tempDir = join(tmpdir(), 'mowen-test');
    mkdirSync(tempDir, { recursive: true });
    const tempFile = join(tempDir, 'test-short.md');

    writeFileSync(tempFile, '# 短文章\n\n太短了。');

    try {
      await expect(publish(tempFile, { strict: true })).rejects.toThrow('Quality check failed');
    } finally {
      unlinkSync(tempFile);
    }
  });
});
