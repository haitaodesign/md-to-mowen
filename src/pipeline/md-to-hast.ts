import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import type { Root } from 'hast';

/**
 * 将 Markdown 字符串解析为 HAST（Hypertext AST）。
 * 使用 unified + remark-parse + remark-gfm + remark-rehype。
 */
export function mdToHast(markdown: string): Root {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype, { allowDangerousHtml: false });

  const mdast = processor.parse(markdown);
  const hast = processor.runSync(mdast) as Root;
  return hast;
}
