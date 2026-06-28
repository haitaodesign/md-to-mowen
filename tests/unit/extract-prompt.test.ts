import { describe, it, expect } from 'vitest';
import { extractPrompt } from '../../src/core/extract-prompt.js';

describe('extractPrompt', () => {
  it('should extract prompt from article with title', () => {
    const md = `# 人工智能的未来

人工智能正在改变世界。机器学习、深度学习、自然语言处理等技术正在快速发展。

## 应用场景

AI 在医疗、金融、教育等领域都有广泛应用。`;

    const prompt = extractPrompt(md);
    expect(prompt).toContain('人工智能的未来');
    expect(prompt.length).toBeLessThanOrEqual(1000);
  });

  it('should extract keywords from body', () => {
    const md = `# 技术文章

云计算、大数据、人工智能是当前最热门的技术方向。
云计算提供了弹性计算资源，大数据分析帮助企业决策。`;

    const prompt = extractPrompt(md);
    expect(prompt).toContain('云计算');
    expect(prompt).toContain('大数据');
  });

  it('should handle empty article', () => {
    const md = '';
    const prompt = extractPrompt(md);
    expect(prompt).toContain('专业简洁风格');
    expect(prompt.length).toBeLessThanOrEqual(1000);
  });

  it('should handle article without title', () => {
    const md = `这是一篇没有标题的文章。

人工智能和机器学习正在改变世界。`;

    const prompt = extractPrompt(md);
    expect(prompt).toContain('人工智能');
    expect(prompt.length).toBeLessThanOrEqual(1000);
  });

  it('should respect max length', () => {
    const md = '# 标题\n\n' + '内容'.repeat(1000);
    const prompt = extractPrompt(md, 50);
    expect(prompt.length).toBeLessThanOrEqual(50);
  });
});
