import { withRetry } from '../shared/retry.js';

const BASE_URL = 'https://open.mowen.cn';

export interface UploadForm {
  endpoint: string;
  key: string;
  policy: string;
  callback: string;
  success_action_status: string;
  'x-oss-credential': string;
  'x-oss-date': string;
  'x-oss-meta-mo-uid': string;
  'x-oss-signature': string;
  'x-oss-signature-version': string;
  'x:file_id': string;
  'x:file_name': string;
  'x:file_uid': string;
}

export interface UploadPrepareResponse {
  form: UploadForm;
}

export interface UploadUrlResponse {
  file: {
    fileId: string;
  };
}

export type FileType = 1 | 2 | 3; // 1=图片, 2=音频, 3=PDF

/**
 * 墨问 API 客户端
 */
export class MowenClient {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error('MOWEN_API_KEY is required');
    this.apiKey = apiKey;
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(path: string, body: unknown): Promise<T> {
    const res = await withRetry(
      () =>
        fetch(`${BASE_URL}${path}`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(body),
        }),
      {
        shouldRetry: (err) => {
          // 网络错误重试；4xx 不重试
          if (err instanceof MowenApiError && err.code < 500) return false;
          return true;
        },
      },
    );

    const data = (await res.json()) as { code?: number; reason?: string } & T;

    if (!res.ok || data.code) {
      throw new MowenApiError(data.code ?? res.status, data.reason ?? res.statusText);
    }

    return data;
  }

  /** 获取 OSS 上传凭证（本地上传第一步） */
  async uploadPrepare(fileType: FileType, fileName: string): Promise<UploadForm> {
    const res = await this.request<UploadPrepareResponse>('/api/open/api/v1/upload/prepare', { fileType, fileName });
    return res.form;
  }

  /** 基于远程 URL 上传文件（一步完成） */
  async uploadViaUrl(fileType: FileType, url: string, fileName?: string): Promise<string> {
    const res = await this.request<UploadUrlResponse>('/api/open/api/v1/upload/url', {
      fileType,
      url,
      ...(fileName ? { fileName } : {}),
    });
    return res.file.fileId;
  }

  /** 创建笔记，返回 noteId */
  async createNote(body: unknown, settings?: { autoPublish?: boolean; tags?: string[] }): Promise<string> {
    const res = await this.request<{ noteId: string }>('/api/open/api/v1/note/create', {
      body,
      settings: settings ?? {},
    });
    return res.noteId;
  }

  /** 编辑已有笔记（全量替换） */
  async editNote(noteId: string, body: unknown): Promise<void> {
    await this.request('/api/open/api/v1/note/edit', { noteId, body });
  }
}

export class MowenApiError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(`[${code}] ${message}`);
    this.name = 'MowenApiError';
  }
}
