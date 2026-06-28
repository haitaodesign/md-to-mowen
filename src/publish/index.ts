import { MowenClient } from '../mowen/client.js';
import { processFile, type PublishResult } from './process-file.js';

export type { PublishOptions, PublishResult } from './process-file.js';
export type { PipelineStats } from './process-file.js';

/**
 * 将 Markdown 文件发布为墨问笔记。
 *
 * @example
 * ```ts
 * import { publishMdToMowen } from 'md-to-mowen/publish';
 *
 * const result = await publishMdToMowen({
 *   input: './article.md',
 *   apiKey: process.env.MOWEN_API_KEY,
 *   tags: ['tech'],
 * });
 * console.log(result.noteUrl);
 * ```
 */
export async function publishMdToMowen(opts: PublishInput): Promise<PublishResult> {
  const { apiKey, dryRun, ...rest } = opts;

  if (!apiKey && !dryRun) {
    throw new Error('apiKey is required when dryRun is false');
  }

  const client = new MowenClient(apiKey ?? 'dry-run-placeholder');
  return processFile(opts.input, client, rest);
}

export interface PublishInput {
  /** Markdown 文件路径 */
  input: string;
  /** 墨问 API Key（dry-run 模式可省略） */
  apiKey?: string;
  /** 已有笔记 ID（编辑模式，全量替换） */
  noteId?: string;
  /** 标签列表 */
  tags?: string[];
  /** 自动发布（非草稿），默认 false */
  autoPublish?: boolean;
  /** dry-run：走完流水线但不调用墨问 API，默认 false */
  dryRun?: boolean;
  /** 调试缓存目录 */
  cacheDir?: string;
}
