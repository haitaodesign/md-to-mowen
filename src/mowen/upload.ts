import { readFile } from 'fs/promises';
import { basename, extname } from 'path';
import type { MowenClient, UploadForm } from './client.js';
import { withRetry } from '../shared/retry.js';

const MIME_MAP: Record<string, string> = {
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  pdf: 'application/pdf',
};

function mimeFromFileName(fileName: string): string {
  const ext = extname(fileName).slice(1).toLowerCase();
  return MIME_MAP[ext] ?? 'application/octet-stream';
}

/**
 * 上传本地图片文件，返回 fileId。
 * 使用两步 OSS 上传流程：prepare → multipart POST。
 *
 * @param alt 可选的替代文本，用作上传文件名。为空时不传文件名（图片不带标题）。
 */
export async function uploadLocalFile(filePath: string, client: MowenClient, alt?: string): Promise<string> {
  const fileName = alt?.trim() || '';
  const fileBuffer = await readFile(filePath);

  const form = await client.uploadPrepare(1, fileName);
  await ossUpload(form, fileBuffer, fileName || basename(filePath));
  return form['x:file_id'];
}

/**
 * 上传远程 URL 图片，返回 fileId。
 */
export async function uploadRemoteUrl(url: string, client: MowenClient): Promise<string> {
  return client.uploadViaUrl(1, url);
}

/**
 * 上传 Data URI 图片，返回 fileId。
 * 支持 data:image/png;base64,... 格式。
 *
 * @param alt 可选的替代文本，用作上传文件名。为空时不传文件名（图片不带标题）。
 */
export async function uploadDataUri(dataUri: string, client: MowenClient, alt?: string): Promise<string> {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error(`Invalid data URI: ${dataUri.slice(0, 40)}`);

  const mime = match[1] ?? 'image/png';
  const b64 = match[2] ?? '';
  const ext = mime.split('/')[1] ?? 'png';
  const uploadFileName = alt?.trim() || '';
  const ossFileName = `image.${ext}`;
  const buffer = Buffer.from(b64, 'base64');

  const form = await client.uploadPrepare(1, uploadFileName);
  await ossUpload(form, buffer, ossFileName);
  return form['x:file_id'];
}

/**
 * OSS multipart 直传（第二步）。
 */
async function ossUpload(form: UploadForm, fileBuffer: Buffer, fileName: string): Promise<void> {
  await withRetry(async () => {
    const formData = new FormData();

    // 按 API 文档顺序添加所有表单字段（endpoint 除外）
    const fields: (keyof UploadForm)[] = [
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
    ];

    for (const field of fields) {
      formData.append(field, form[field]);
    }

    formData.append('file', new Blob([fileBuffer], { type: mimeFromFileName(fileName) }), fileName);

    const res = await fetch(form.endpoint, { method: 'POST', body: formData });
    if (!res.ok) {
      throw new Error(`OSS upload failed: ${res.status} ${res.statusText}`);
    }
  });
}
