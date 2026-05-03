import type { MASTDocument, MASTImageBlock, MASTAudioBlock } from '../mast/types.js';
import type { MowenClient } from '../mowen/client.js';
import { uploadLocalFile, uploadRemoteUrl, uploadDataUri } from '../mowen/upload.js';
import { renderTableToPng } from './table-renderer.js';
import { withRetry } from '../shared/retry.js';
import { basename } from 'path';

export interface AssetAdapterOptions {
  /** 相对路径图片的基准目录（通常为 Markdown 文件所在目录） */
  baseDir?: string;
  /** dry-run 模式：跳过实际上传，uuid 填入占位符 */
  dryRun?: boolean;
}

/**
 * 遍历 MAST，将所有 MASTImageBlock 的资源上传到墨问 OSS，
 * 并将返回的 fileId 写入 block.uuid。
 *
 * 表格（isTable: true）先用 Playwright 渲染为 PNG，再上传。
 */
export async function processAssets(
  doc: MASTDocument,
  client: MowenClient,
  opts: AssetAdapterOptions = {},
): Promise<void> {
  const { baseDir = process.cwd(), dryRun = false } = opts;

  const imageBlocks = Object.values(doc.blocks).filter((b): b is MASTImageBlock => b.type === 'image');
  const audioBlocks = Object.values(doc.blocks).filter((b): b is MASTAudioBlock => b.type === 'audio');

  // 并发上传，最多 3 个同时进行
  await concurrentMap([...imageBlocks, ...audioBlocks], 3, async (block) => {
    if (dryRun) {
      block.uuid = `dry-run-${block.id}`;
      return;
    }

    if (block.type === 'audio') {
      block.uuid = await uploadAudioBlock(block, client, baseDir);
    } else {
      block.uuid = await uploadBlock(block, client, baseDir);
    }
  });
}

async function uploadAudioBlock(block: MASTAudioBlock, client: MowenClient, baseDir: string): Promise<string> {
  const src = block.src;

  // 远程 URL
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return client.uploadViaUrl(2, src);
  }

  // 本地路径
  const { readFile } = await import('fs/promises');
  const { resolve, isAbsolute, basename } = await import('path');
  const absPath = isAbsolute(src) ? src : resolve(baseDir, src);
  const fileName = basename(absPath);
  const fileBuffer = await readFile(absPath);
  const form = await client.uploadPrepare(2, fileName);

  await withRetry(async () => {
    const formData = new FormData();
    const fields = [
      'key',
      'policy',
      'callback',
      'success_action_status',
      'x-oss-credential',
      'x-oss-date',
      'x-oss-meta-mo-uid',
      'x-oss-signature',
      'x-oss-signature-version',
      'x:file_id',
      'x:file_name',
      'x:file_uid',
    ] as const;
    for (const field of fields) {
      formData.append(field, (form as Record<string, string>)[field]);
    }
    formData.append('file', new Blob([fileBuffer]), fileName);
    const res = await fetch(form.endpoint, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`OSS upload failed: ${res.status}`);
  });

  return form['x:file_id'];
}

async function uploadBlock(block: MASTImageBlock, client: MowenClient, baseDir: string): Promise<string> {
  // 表格：先渲染为 PNG，再上传
  if (block.isTable) {
    const pngBuffer = await renderTableToPng(block.src);
    return uploadPngBuffer(pngBuffer, client);
  }

  const src = block.src;

  // Data URI
  if (src.startsWith('data:')) {
    return uploadDataUri(src, client);
  }

  // 远程 URL
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return uploadRemoteUrl(src, client);
  }

  // 本地路径（绝对或相对）
  const { resolve, isAbsolute } = await import('path');
  const absPath = isAbsolute(src) ? src : resolve(baseDir, src);
  return uploadLocalFile(absPath, client);
}

/**
 * 上传内存中的 PNG Buffer（表格渲染结果）。
 * 通过 prepare → OSS 两步上传。
 */
async function uploadPngBuffer(buffer: Buffer, client: MowenClient): Promise<string> {
  const fileName = `table-${Date.now()}.png`;
  const form = await client.uploadPrepare(1, fileName);

  await withRetry(async () => {
    const formData = new FormData();
    const fields = [
      'key',
      'policy',
      'callback',
      'success_action_status',
      'x-oss-credential',
      'x-oss-date',
      'x-oss-meta-mo-uid',
      'x-oss-signature',
      'x-oss-signature-version',
      'x:file_id',
      'x:file_name',
      'x:file_uid',
    ] as const;

    for (const field of fields) {
      formData.append(field, (form as Record<string, string>)[field]);
    }
    formData.append('file', new Blob([buffer], { type: 'image/png' }), fileName);

    const res = await fetch(form.endpoint, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`OSS upload failed: ${res.status}`);
  });

  return form['x:file_id'];
}

/** 限制并发数的 map */
async function concurrentMap<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()!;
      await fn(item);
    }
  });
  await Promise.all(workers);
}
