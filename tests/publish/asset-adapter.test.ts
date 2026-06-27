import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processAssets } from '../../src/publish/asset-adapter.js';
import type { MASTDocument, MASTImageBlock } from '../../src/mast/types.js';
import type { MowenClient } from '../../src/mowen/client.js';

// ── Mock ──────────────────────────────────────────────────────────────────────

// mock table-renderer，避免启动 Playwright
vi.mock('../../src/publish/table-renderer.js', () => ({
  renderTableToPng: vi.fn().mockResolvedValue(Buffer.from('fake-png')),
}));

function makeClient(overrides: Partial<MowenClient> = {}): MowenClient {
  return {
    uploadPrepare: vi.fn().mockResolvedValue({
      endpoint: 'https://oss.example.com/',
      key: 'path/to/file',
      policy: 'policy',
      callback: 'callback',
      success_action_status: '200',
      'x-oss-credential': 'cred',
      'x-oss-date': '20240101T000000Z',
      'x-oss-meta-mo-uid': 'uid',
      'x-oss-signature': 'sig',
      'x-oss-signature-version': 'OSS4-HMAC-SHA256',
      'x:file_id': 'file-id-123',
      'x:file_name': 'image.png',
      'x:file_uid': 'uid_xxx',
    }),
    uploadViaUrl: vi.fn().mockResolvedValue('remote-file-id-456'),
    createNote: vi.fn(),
    editNote: vi.fn(),
    ...overrides,
  } as unknown as MowenClient;
}

function makeDoc(blocks: MASTImageBlock[]): MASTDocument {
  const doc: MASTDocument = { blocks: {}, topLevel: [] };
  for (const b of blocks) {
    doc.blocks[b.id] = b;
    doc.topLevel.push(b.id);
  }
  return doc;
}

function imageBlock(overrides: Partial<MASTImageBlock> = {}): MASTImageBlock {
  return {
    id: 'b_1',
    type: 'image',
    src: 'https://example.com/img.png',
    alt: 'test',
    align: 'center',
    ...overrides,
  };
}

// ── dry-run ───────────────────────────────────────────────────────────────────

describe('dry-run 模式', () => {
  it('不调用 API，uuid 填入占位符', async () => {
    const client = makeClient();
    const block = imageBlock();
    const doc = makeDoc([block]);

    await processAssets(doc, client, { dryRun: true });

    expect(client.uploadPrepare).not.toHaveBeenCalled();
    expect(client.uploadViaUrl).not.toHaveBeenCalled();
    expect(block.uuid).toMatch(/^dry-run-/);
  });
});

// ── 远程 URL ──────────────────────────────────────────────────────────────────

describe('远程 URL 图片', () => {
  it('调用 uploadViaUrl，写入 uuid', async () => {
    const client = makeClient();
    const block = imageBlock({ src: 'https://example.com/photo.jpg' });
    const doc = makeDoc([block]);

    await processAssets(doc, client, { dryRun: false });

    expect(client.uploadViaUrl).toHaveBeenCalledWith(1, 'https://example.com/photo.jpg');
    expect(block.uuid).toBe('remote-file-id-456');
  });

  it('http:// 也走远程上传', async () => {
    const client = makeClient();
    const block = imageBlock({ src: 'http://example.com/img.png' });
    const doc = makeDoc([block]);

    await processAssets(doc, client, { dryRun: false });

    expect(client.uploadViaUrl).toHaveBeenCalled();
    expect(block.uuid).toBe('remote-file-id-456');
  });
});

// ── 表格渲染 ──────────────────────────────────────────────────────────────────

describe('表格渲染', () => {
  beforeEach(() => {
    // mock fetch for OSS upload
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 } as Response);
  });

  it('isTable=true → 调用 renderTableToPng + uploadPrepare', async () => {
    const { renderTableToPng } = await import('../../src/publish/table-renderer.js');
    const client = makeClient();
    const block = imageBlock({
      id: 'b_t1',
      src: '| A | B |\n|---|---|\n| 1 | 2 |',
      isTable: true,
    });
    const doc = makeDoc([block]);

    await processAssets(doc, client, { dryRun: false });

    expect(renderTableToPng).toHaveBeenCalledWith(block.src);
    expect(client.uploadPrepare).toHaveBeenCalledWith(1, '');
    expect(block.uuid).toBe('file-id-123');
  });
});

// ── 多图片并发 ────────────────────────────────────────────────────────────────

describe('多图片并发处理', () => {
  it('多个远程图片全部获得 uuid', async () => {
    let callCount = 0;
    const client = makeClient({
      uploadViaUrl: vi.fn().mockImplementation(async () => {
        callCount++;
        return `file-id-${callCount}`;
      }),
    });

    const blocks = [
      imageBlock({ id: 'b_1', src: 'https://example.com/1.png' }),
      imageBlock({ id: 'b_2', src: 'https://example.com/2.png' }),
      imageBlock({ id: 'b_3', src: 'https://example.com/3.png' }),
    ];
    const doc = makeDoc(blocks);

    await processAssets(doc, client, { dryRun: false });

    expect(client.uploadViaUrl).toHaveBeenCalledTimes(3);
    for (const b of blocks) {
      expect(b.uuid).toBeDefined();
    }
  });
});

// ── 无图片文档 ────────────────────────────────────────────────────────────────

describe('无图片文档', () => {
  it('空文档不报错', async () => {
    const client = makeClient();
    const doc: MASTDocument = { blocks: {}, topLevel: [] };
    await expect(processAssets(doc, client, { dryRun: false })).resolves.toBeUndefined();
  });

  it('只有段落块，不调用任何上传', async () => {
    const client = makeClient();
    const doc: MASTDocument = {
      blocks: {
        b_1: { id: 'b_1', type: 'paragraph', content: [{ type: 'text', text: 'hello' }] },
      },
      topLevel: ['b_1'],
    };
    await processAssets(doc, client, { dryRun: false });
    expect(client.uploadViaUrl).not.toHaveBeenCalled();
    expect(client.uploadPrepare).not.toHaveBeenCalled();
  });
});
