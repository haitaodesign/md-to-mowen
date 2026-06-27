import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import type { Root } from 'hast';

/** 高亮标记字符（U+2E3B THREE-EM DASH），用作 ==text== 的中间占位符 */
export const HIGHLIGHT_MARKER = '⸻';

/**
 * 预处理 Markdown 中的 ==text== 高亮语法。
 * 将 `==内容==` 替换为 `⸻内容⸻`（marker 包裹），
 * 供后续 extractInline 阶段识别并转换为 highlight mark。
 */
function preprocessHighlight(markdown: string): string {
  return markdown.replace(/==([^\n=]+?)==/g, `${HIGHLIGHT_MARKER}$1${HIGHLIGHT_MARKER}`);
}

/**
 * 将 Markdown 字符串解析为 HAST（Hypertext AST）。
 * 使用 unified + remark-parse + remark-gfm + remark-rehype。
 */
export function mdToHast(markdown: string): Root {
  const processed = preprocessHighlight(markdown);
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype, { allowDangerousHtml: false });

  const mdast = processor.parse(processed);
  const hast = processor.runSync(mdast) as Root;
  return hast;
}
