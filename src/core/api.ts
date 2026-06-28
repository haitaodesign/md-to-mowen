/**
 * 墨问 API 封装模块
 */

import type { NoteAtomDoc } from '../index.js';

export type PrivacyType = 'public' | 'private' | 'rule';

export interface NoteSettings {
  autoPublish?: boolean;
  tags?: string[];
}

interface ApiOptions {
  apiKey?: string;
  baseUrl?: string;
}

/**
 * 获取 API Key
 */
function getApiKey(options: ApiOptions): string {
  const apiKey = options.apiKey || process.env.MOWEN_API_KEY;
  if (!apiKey) {
    throw new Error('MOWEN_API_KEY is not set. Please set it via environment variable or options.');
  }
  return apiKey;
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 通用 API 调用（带重试）
 */
async function callApi<T>(
  endpoint: string,
  method: string,
  body: Record<string, unknown>,
  options: ApiOptions,
  retries = 3
): Promise<T> {
  const apiKey = getApiKey(options);
  const baseUrl = options.baseUrl || 'https://open.mowen.cn';

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      // 处理速率限制
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000 * attempt;
        console.warn(`Rate limited, waiting ${waitMs}ms before retry...`);
        await delay(waitMs);
        continue;
      }

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as Record<string, unknown>;
      if ('reason' in data && data.reason) {
        throw new Error(`API error: ${data.reason}`);
      }

      return data as T;
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries) {
        const waitMs = 1000 * attempt;
        console.warn(`API call failed (attempt ${attempt}/${retries}), retrying in ${waitMs}ms...`);
        await delay(waitMs);
      }
    }
  }

  throw lastError || new Error('API call failed after retries');
}

/**
 * 墨问 API 类
 */
export class MowenAPI {
  private options: ApiOptions;

  constructor(options: ApiOptions = {}) {
    this.options = options;
  }

  /**
   * 创建笔记（自动设置为 private）
   */
  async createNote(body: NoteAtomDoc, settings: NoteSettings = {}): Promise<{ noteId: string }> {
    const result = await callApi<{ noteId: string }>(
      '/api/open/api/v1/note/create',
      'POST',
      {
        body,
        settings: {
          autoPublish: settings.autoPublish ?? false,
          tags: settings.tags ?? [],
        },
      },
      this.options
    );

    // 自动设置为 private（与原仓库行为一致）
    try {
      await this.setPrivacy(result.noteId, 'private');
    } catch (error) {
      console.warn(`Warning: Failed to set privacy for note ${result.noteId}:`, error);
    }

    return result;
  }

  /**
   * 编辑笔记
   */
  async editNote(noteId: string, body: NoteAtomDoc): Promise<void> {
    await callApi<unknown>('/api/open/api/v1/note/edit', 'POST', { noteId, body }, this.options);
  }

  /**
   * 设置笔记隐私
   */
  async setPrivacy(
    noteId: string,
    privacy: PrivacyType,
    options: { noShare?: boolean; expireAt?: number | null } = {}
  ): Promise<void> {
    await callApi<unknown>(
      '/api/open/api/v1/note/set',
      'POST',
      {
        noteId,
        section: 1,
        settings: {
          privacy: {
            type: privacy,
            noShare: options.noShare ?? false,
            expireAt: options.expireAt ?? null,
          },
        },
      },
      this.options
    );
  }

  /**
   * 通过 URL 上传文件
   * @param fileType 1=图片, 2=音频, 3=PDF
   * @param url 文件 URL
   * @param fileName 文件名（可选）
   */
  async uploadViaUrl(
    fileType: number,
    url: string,
    fileName?: string
  ): Promise<{ fileId: string }> {
    return callApi<{ fileId: string }>(
      '/api/open/api/v1/upload/url',
      'POST',
      {
        fileType,
        url,
        ...(fileName ? { fileName } : {}),
      },
      this.options
    );
  }

  /**
   * 重置 API Key
   */
  async resetApiKey(): Promise<{ apiKey: string }> {
    return callApi<{ apiKey: string }>('/api/open/api/v1/auth/key/reset', 'POST', {}, this.options);
  }
}
