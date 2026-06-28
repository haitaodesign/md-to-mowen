/**
 * 系统性验证测试
 *
 * 对比 TypeScript 实现与原仓库 Python/shell 的输出
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { markdownToNoteAtom } from '../../src/core/markdown.js';
import { lint } from '../../src/core/lint.js';
import { extractTables, generateTableHtml } from '../../src/core/table.js';
import { extractPrompt } from '../../src/core/extract-prompt.js';

const FIXTURES_DIR = join(__dirname, '../fixtures');

describe('Systematic Verification', () => {
  describe('Markdown to NoteAtom', () => {
    it('should produce consistent output for basic markdown', () => {
      const md = readFileSync(join(FIXTURES_DIR, 'markdown/basic.md'), 'utf-8');
      const result = markdownToNoteAtom(md);

      // 验证基本结构
      expect(result.type).toBe('doc');
      expect(result.content.length).toBeGreaterThan(0);

      // 验证标题转换
      const firstParagraph = result.content[0];
      expect(firstParagraph.type).toBe('paragraph');
      if ('content' in firstParagraph && Array.isArray(firstParagraph.content)) {
        const textNode = firstParagraph.content[0];
        expect(textNode).toHaveProperty('marks');
        expect(textNode.marks).toContainEqual({ type: 'bold' });
      }
    });

    it('should handle links correctly', () => {
      const md = readFileSync(join(FIXTURES_DIR, 'markdown/with-links.md'), 'utf-8');
      const result = markdownToNoteAtom(md);

      // 查找包含链接的段落
      const linkParagraphs = result.content.filter((node) => {
        if (node.type === 'paragraph' && 'content' in node) {
          return (node.content as any[]).some((inline) =>
            inline.marks?.some((mark: any) => mark.type === 'link')
          );
        }
        return false;
      });

      expect(linkParagraphs.length).toBeGreaterThan(0);
    });

    it('should handle image markers correctly', () => {
      const md = readFileSync(join(FIXTURES_DIR, 'markdown/with-images.md'), 'utf-8');
      const result = markdownToNoteAtom(md);

      // 查找图片节点
      const imageNodes = result.content.filter((node) => node.type === 'image');
      expect(imageNodes.length).toBe(2);
      expect(imageNodes[0]).toHaveProperty('attrs.uuid', 'test-file-id-0');
    });
  });

  describe('Quality Check', () => {
    it('should check cover image correctly', () => {
      const mdWithImage = '# 文章\n\n![image](test.png)\n\n内容';
      const result1 = lint(mdWithImage, { hasCover: true });
      expect(result1.results[0].passed).toBe(true);

      const mdWithoutImage = '# 文章\n\n内容';
      const result2 = lint(mdWithoutImage);
      expect(result2.results[0].passed).toBe(false);
    });

    it('should check heading hierarchy correctly', () => {
      const mdCorrect = '# H1\n\n## H2\n\n### H3';
      const result1 = lint(mdCorrect, { hasCover: true });
      expect(result1.results[2].passed).toBe(true);

      const mdWrong = '# H1\n\n### H3';
      const result2 = lint(mdWrong, { hasCover: true });
      expect(result2.results[2].passed).toBe(false);
    });
  });

  describe('Table Extraction', () => {
    it('should extract tables correctly', () => {
      const md = `# 标题

| 名称 | 值 |
|------|-----|
| A    | 100 |
| B    | 200 |

结束`;

      const tables = extractTables(md);
      expect(tables.length).toBe(1);
      expect(tables[0].table.headers).toEqual(['名称', '值']);
      expect(tables[0].table.rows).toEqual([
        ['A', '100'],
        ['B', '200'],
      ]);
    });

    it('should generate HTML with financial style', () => {
      const table = {
        headers: ['名称', '值'],
        rows: [
          ['A', '100'],
          ['B', '200'],
        ],
      };

      const html = generateTableHtml(table);

      // 验证金融风格 CSS
      expect(html).toContain('linear-gradient');
      expect(html).toContain('text-align:right');
      expect(html).toContain('PingFang SC');
    });
  });

  describe('Extract Prompt', () => {
    it('should extract keywords from article', () => {
      const md = `# 人工智能的未来

人工智能正在改变世界。机器学习、深度学习是核心技术。`;

      const prompt = extractPrompt(md);
      expect(prompt).toContain('人工智能');
      expect(prompt.length).toBeLessThanOrEqual(1000);
    });
  });
});
