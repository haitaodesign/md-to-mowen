import { describe, it, expect } from 'vitest';
import { lint } from '../../src/core/lint.js';

describe('lint', () => {
  describe('cover image check', () => {
    it('should pass when hasCover is true', () => {
      const result = lint('# 文章\n\n内容', { hasCover: true });
      expect(result.results[0].passed).toBe(true);
    });

    it('should pass when markdown has image', () => {
      const result = lint('# 文章\n\n![image](test.png)\n\n内容');
      expect(result.results[0].passed).toBe(true);
    });

    it('should pass when markdown has table image marker', () => {
      const result = lint('# 文章\n\n<!-- TABLE_IMAGE_0:xxx -->\n\n内容');
      expect(result.results[0].passed).toBe(true);
    });

    it('should fail when no image', () => {
      const result = lint('# 文章\n\n内容');
      expect(result.results[0].passed).toBe(false);
    });
  });

  describe('table check', () => {
    it('should pass when no tables', () => {
      const result = lint('# 文章\n\n内容', { hasCover: true });
      expect(result.results[1].passed).toBe(true);
    });

    it('should pass when tables are converted', () => {
      const md = '# 文章\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n<!-- TABLE_IMAGE_0:xxx -->';
      const result = lint(md, { hasCover: true });
      expect(result.results[1].passed).toBe(true);
    });

    it('should fail when tables not converted', () => {
      const md = '# 文章\n\n| A | B |\n|---|---|\n| 1 | 2 |';
      const result = lint(md, { hasCover: true });
      expect(result.results[1].passed).toBe(false);
    });
  });

  describe('heading hierarchy check', () => {
    it('should pass with correct hierarchy', () => {
      const md = '# H1\n\n## H2\n\n### H3';
      const result = lint(md, { hasCover: true });
      expect(result.results[2].passed).toBe(true);
    });

    it('should fail when skipping levels', () => {
      const md = '# H1\n\n### H3';
      const result = lint(md, { hasCover: true });
      expect(result.results[2].passed).toBe(false);
    });

    it('should fail when not starting with H1', () => {
      const md = '## H2\n\n### H3';
      const result = lint(md, { hasCover: true });
      expect(result.results[2].passed).toBe(false);
    });
  });

  describe('article length check', () => {
    it('should pass with normal length', () => {
      const md = '# 文章\n\n' + '内容'.repeat(100);
      const result = lint(md, { hasCover: true, minChars: 100 });
      expect(result.results[3].passed).toBe(true);
    });

    it('should fail when too short', () => {
      const md = '# 文章\n\n短';
      const result = lint(md, { hasCover: true, minChars: 100 });
      expect(result.results[3].passed).toBe(false);
    });
  });

  describe('unprocessed markers check', () => {
    it('should pass when no markers', () => {
      const result = lint('# 文章\n\n内容', { hasCover: true });
      expect(result.results[4].passed).toBe(true);
    });

    it('should fail when has TODO', () => {
      const result = lint('# 文章\n\n[TODO: 完成这个]', { hasCover: true });
      expect(result.results[4].passed).toBe(false);
    });
  });

  describe('overall result', () => {
    it('should pass when all checks pass', () => {
      const md = '# 文章\n\n![image](test.png)\n\n' + '内容'.repeat(100);
      const result = lint(md);
      expect(result.passed).toBe(true);
    });

    it('should fail when any check fails', () => {
      const md = '# 文章\n\n内容';
      const result = lint(md);
      expect(result.passed).toBe(false);
    });

    it('should return correct summary', () => {
      const md = '# 文章\n\n![image](test.png)\n\n' + '内容'.repeat(300);
      const result = lint(md);
      expect(result.summary).toBe('5/5 通过');
    });
  });
});
