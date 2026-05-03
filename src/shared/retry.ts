/**
 * 指数退避重试工具
 */
export interface RetryOptions {
  maxAttempts?: number; // 最大尝试次数（含首次），默认 3
  initialDelayMs?: number; // 初始等待时间（ms），默认 1000
  maxDelayMs?: number; // 最大等待时间（ms），默认 30000
  shouldRetry?: (err: unknown) => boolean; // 返回 false 则不重试
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const { maxAttempts = 3, initialDelayMs = 1000, maxDelayMs = 30000, shouldRetry } = opts;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts) break;
      if (shouldRetry && !shouldRetry(err)) break;

      const delay = Math.min(initialDelayMs * 2 ** (attempt - 1), maxDelayMs);
      await sleep(delay);
    }
  }
  throw lastErr;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
