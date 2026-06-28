import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { markdownToNoteAtom } from '../../src/core/markdown.js';

const FIXTURES_DIR = join(__dirname, '../fixtures');

function loadFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, 'markdown', `${name}.md`), 'utf-8');
}

function loadExpected(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(FIXTURES_DIR, 'expected', `${name}.json`), 'utf-8'));
}

describe('markdownToNoteAtom', () => {
  it('should convert basic markdown', () => {
    const md = loadFixture('basic');
    const result = markdownToNoteAtom(md);
    const expected = loadExpected('basic');
    expect(result).toEqual(expected);
  });

  it('should convert markdown with links', () => {
    const md = loadFixture('with-links');
    const result = markdownToNoteAtom(md);
    const expected = loadExpected('with-links');
    expect(result).toEqual(expected);
  });

  it('should convert markdown with image markers', () => {
    const md = loadFixture('with-images');
    const result = markdownToNoteAtom(md);
    const expected = loadExpected('with-images');
    expect(result).toEqual(expected);
  });

  it('should convert full markdown', () => {
    const md = loadFixture('full');
    const result = markdownToNoteAtom(md);
    const expected = loadExpected('full');
    expect(result).toEqual(expected);
  });

  it('should insert cover image as first element', () => {
    const md = '# 标题\n\n内容';
    const result = markdownToNoteAtom(md, { coverImageId: 'cover-123' });
    expect(result.content[0]).toEqual({
      type: 'image',
      attrs: { uuid: 'cover-123', alt: '', align: 'center' },
    });
    expect(result.content[1]).toEqual({
      type: 'paragraph',
      content: [{ type: 'text', text: '标题', marks: [{ type: 'bold' }] }],
    });
  });

  it('should handle empty markdown', () => {
    const result = markdownToNoteAtom('');
    expect(result.type).toBe('doc');
    expect(result.content.length).toBeGreaterThan(0);
  });

  it('should handle markdown with only whitespace', () => {
    const result = markdownToNoteAtom('   \n  \n  ');
    expect(result.type).toBe('doc');
    expect(result.content.length).toBeGreaterThan(0);
  });
});
