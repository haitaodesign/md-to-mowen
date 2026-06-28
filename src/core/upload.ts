/**
 * 墨问图片上传模块
 *
 * 两阶段上传：
 * 1. 调用 /upload/prepare 获取 OSS 凭证
 * 2. Multipart POST 上传到 OSS
 */

export interface UploadResult {
  fileId: string;
  fileName: string;
}

interface PrepareResponse {
  form: {
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
    'x:file_uid': string;
  };
}

interface UploadOptions {
  apiKey?: string;
  baseUrl?: string;
}

/**
 * 获取 API Key（优先环境变量，其次参数）
 */
function getApiKey(options: UploadOptions): string {
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
 * 步骤 1: 获取上传授权（带重试）
 */
async function prepareUpload(
  fileName: string,
  options: UploadOptions,
  retries = 3
): Promise<PrepareResponse> {
  const apiKey = getApiKey(options);
  const baseUrl = options.baseUrl || 'https://open.mowen.cn';

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/api/open/api/v1/upload/prepare`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileType: 1,
          fileName,
        }),
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
        throw new Error(`Upload prepare failed: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as Record<string, unknown>;
      if ('code' in data) {
        throw new Error(`Upload prepare error: ${JSON.stringify(data)}`);
      }

      return data as unknown as PrepareResponse;
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries) {
        const waitMs = 1000 * attempt;
        console.warn(
          `Upload prepare failed (attempt ${attempt}/${retries}), retrying in ${waitMs}ms...`
        );
        await delay(waitMs);
      }
    }
  }

  throw lastError || new Error('Upload prepare failed after retries');
}

/**
 * 步骤 2: 上传文件到 OSS
 */
async function uploadToOss(
  filePath: string,
  fileName: string,
  prepareData: PrepareResponse
): Promise<void> {
  const { form } = prepareData;

  // 读取文件
  const { readFile } = await import('fs/promises');
  const fileBuffer = await readFile(filePath);

  // 构建 FormData
  const formData = new FormData();
  formData.append('key', form.key);
  formData.append('policy', form.policy);
  formData.append('callback', form.callback);
  formData.append('success_action_status', form.success_action_status);
  formData.append('x-oss-credential', form['x-oss-credential']);
  formData.append('x-oss-date', form['x-oss-date']);
  formData.append('x-oss-meta-mo-uid', form['x-oss-meta-mo-uid']);
  formData.append('x-oss-signature', form['x-oss-signature']);
  formData.append('x-oss-signature-version', form['x-oss-signature-version']);
  formData.append('x:file_id', form['x:file_id']);
  formData.append('x:file_name', fileName);
  formData.append('x:file_uid', form['x:file_uid']);
  formData.append('file', new Blob([fileBuffer]), fileName);

  const response = await fetch(form.endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }
}

/**
 * 上传图片到墨问
 */
export async function uploadImage(
  filePath: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { basename } = await import('path');
  const fileName = basename(filePath);

  // 步骤 1: 获取上传授权
  const prepareData = await prepareUpload(fileName, options);

  // 步骤 2: 上传文件
  await uploadToOss(filePath, fileName, prepareData);

  return {
    fileId: prepareData.form['x:file_id'],
    fileName,
  };
}

/**
 * 批量上传图片
 */
export async function uploadImages(
  filePaths: string[],
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (const filePath of filePaths) {
    const result = await uploadImage(filePath, options);
    results.push(result);
  }

  return results;
}
