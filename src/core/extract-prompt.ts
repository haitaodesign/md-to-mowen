/**
 * 从 Markdown 文章中提取关键词生成封面图提示词
 *
 * 与原仓库 extract_prompt.py 功能一致
 */

/**
 * 从文章中提取关键词
 */
function extractKeywords(text: string): string[] {
  // 移除 markdown 标记
  const cleanText = text
    .replace(/[#*`~[\]()>-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // 提取中文词汇（2-4字）
  const chineseWords = cleanText.match(/[一-龥]{2,4}/g) || [];

  // 去重
  const uniqueWords = [...new Set(chineseWords)];

  // 按出现频率排序
  const wordCount = new Map<string, number>();
  for (const word of uniqueWords) {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  }

  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
}

/**
 * 从 Markdown 文章生成 GLM-Image 提示词
 *
 * @param mdContent Markdown 文章内容
 * @param maxLength 最大提示词长度（默认 1000）
 * @returns GLM-Image 提示词
 */
export function extractPrompt(mdContent: string, maxLength = 1000): string {
  const lines = mdContent.split('\n');

  // 提取标题
  const title =
    lines
      .find((line) => line.startsWith('# '))
      ?.slice(2)
      .trim() || '';

  // 提取正文（移除标题、代码块、图片等）
  const bodyLines = lines.filter(
    (line) =>
      !line.startsWith('#') &&
      !line.startsWith('```') &&
      !line.startsWith('![') &&
      !line.startsWith('<!--') &&
      line.trim() !== ''
  );
  const body = bodyLines.join(' ');

  // 提取关键词
  const keywords = extractKeywords(body);

  // 构建提示词
  let prompt = '';

  if (title) {
    prompt += `关于"${title}"的插图，`;
  }

  if (keywords.length > 0) {
    prompt += `主题：${keywords.slice(0, 10).join('、')}，`;
  }

  prompt += '专业简洁风格，高清质感';

  // 截断到最大长度
  if (prompt.length > maxLength) {
    prompt = prompt.slice(0, maxLength - 3) + '...';
  }

  return prompt;
}
