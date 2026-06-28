import { describe, it, expect } from 'vitest';
import {
  extractTables,
  generateTableHtml,
  replaceTablesWithMarkers,
} from '../../src/core/table.js';

describe('extractTables', () => {
  it('should extract simple table', () => {
    const md = `# 标题

| 名称 | 值 |
|------|-----|
| A    | 100 |
| B    | 200 |

结束`;

    const tables = extractTables(md);
    expect(tables).toHaveLength(1);
    expect(tables[0].table.headers).toEqual(['名称', '值']);
    expect(tables[0].table.rows).toEqual([
      ['A', '100'],
      ['B', '200'],
    ]);
  });

  it('should extract multiple tables', () => {
    const md = `| A | B |
|---|---|
| 1 | 2 |

文本

| C | D |
|---|---|
| 3 | 4 |`;

    const tables = extractTables(md);
    expect(tables).toHaveLength(2);
  });

  it('should return empty array when no tables', () => {
    const md = `# 标题

普通文本

- 列表项`;

    const tables = extractTables(md);
    expect(tables).toHaveLength(0);
  });
});

describe('generateTableHtml', () => {
  it('should generate HTML for table', () => {
    const table = {
      headers: ['名称', '值'],
      rows: [
        ['A', '100'],
        ['B', '200'],
      ],
    };

    const html = generateTableHtml(table);
    expect(html).toContain('<th>名称</th>');
    expect(html).toContain('<th>值</th>');
    expect(html).toContain('<td>A</td>');
    expect(html).toContain('100'); // 数字列会添加 style="text-align:right"
  });
});

describe('replaceTablesWithMarkers', () => {
  it('should replace table with marker', () => {
    const md = `# 标题

| A | B |
|---|---|
| 1 | 2 |

结束`;

    const result = replaceTablesWithMarkers(md, [
      { index: 0, fileId: 'test-file-id', marker: '<!-- TABLE_IMAGE_0:test-file-id -->' },
    ]);

    expect(result).toContain('<!-- TABLE_IMAGE_0:test-file-id -->');
    expect(result).not.toContain('| A | B |');
  });
});
