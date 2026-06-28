/**
 * 表格渲染模块
 *
 * 将 Markdown 表格转换为高质量图片
 */

import type { Browser } from 'playwright';

export interface TableImage {
  index: number;
  fileId: string;
  marker: string;
}

interface TableData {
  headers: string[];
  rows: string[][];
}

interface RenderOptions {
  width?: number;
  outputFormat?: 'png' | 'jpeg';
}

/**
 * 从 Markdown 中提取表格
 */
export function extractTables(
  mdContent: string
): Array<{ table: TableData; startIndex: number; endIndex: number }> {
  const tables: Array<{ table: TableData; startIndex: number; endIndex: number }> = [];
  const lines = mdContent.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 检测表格开始（包含 | 的行）
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('---')) {
      const startIndex = i;

      // 解析表头
      const headers = line
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell !== '');

      // 跳过分隔行
      i += 2;

      // 解析数据行
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        const row = lines[i]
          .split('|')
          .map((cell) => cell.trim())
          .filter((cell) => cell !== '');
        rows.push(row);
        i++;
      }

      tables.push({
        table: { headers, rows },
        startIndex,
        endIndex: i - 1,
      });
    } else {
      i++;
    }
  }

  return tables;
}

/**
 * 处理单元格中的内联 markdown
 */
function processInlineMarkdown(text: string): string {
  // 粗体 **text**
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // 斜体 *text*
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // 行内代码 `code`
  text = text.replace(/`(.*?)`/g, '<code>$1</code>');
  return text;
}

/**
 * 检测是否为数字列
 */
function isNumericValue(value: string): boolean {
  const cleaned = value.replace(/[,，%％¥$€£+-]/g, '').trim();
  return !isNaN(parseFloat(cleaned)) && cleaned.length > 0;
}

/**
 * 生成表格 HTML（金融专业风格，与原仓库一致）
 */
export function generateTableHtml(table: TableData): string {
  // 处理表头
  const headerHtml = table.headers
    .map((cell) => `<th>${processInlineMarkdown(cell)}</th>`)
    .join('');

  // 检测数字列
  const numericColumns = table.headers.map((_, colIndex) => {
    const values = table.rows.map((row) => row[colIndex] || '');
    const numericCount = values.filter(isNumericValue).length;
    return numericCount > values.length * 0.5; // 超过50%是数字则为数字列
  });

  // 处理数据行
  const rowsHtml = table.rows
    .map((row) => {
      const cells = row.map((cell, colIndex) => {
        const processed = processInlineMarkdown(cell);
        const isNumeric = numericColumns[colIndex];

        // 特殊 emoji 样式
        let className = '';
        if (cell.includes('✅') || cell.includes('✓')) className = 'positive';
        if (cell.includes('❌') || cell.includes('✗')) className = 'negative';
        if (cell.includes('⚠️') || cell.includes('⚡')) className = 'warning';

        // 数字正负色
        if (isNumeric && (cell.startsWith('+') || cell.includes('↑'))) {
          className = 'positive';
        } else if (isNumeric && (cell.startsWith('-') || cell.includes('↓'))) {
          className = 'negative';
        }

        const align = isNumeric ? ' style="text-align:right"' : '';
        const cls = className ? ` class="${className}"` : '';
        return `<td${align}${cls}>${processed}</td>`;
      });
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
      background: #fff;
    }
    table {
      width: 100%;
      min-width: 600px;
      border-collapse: collapse;
      font-size: 14px;
      line-height: 1.6;
    }
    thead {
      position: sticky;
      top: 0;
      z-index: 1;
    }
    th {
      background: linear-gradient(180deg, #1a365d 0%, #2d4a7a 100%);
      color: #fff;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      letter-spacing: 0.3px;
      border-bottom: 2px solid #0f2940;
    }
    td {
      padding: 10px 16px;
      border-bottom: 1px solid #e2e8f0;
      color: #2d3748;
      vertical-align: middle;
    }
    tr:nth-child(even) { background-color: #f7fafc; }
    tr:nth-child(odd) { background-color: #fff; }
    tr:hover { background-color: #edf2f7; transition: background 0.15s; }
    td strong { font-weight: 600; color: #1a202c; }
    td em { font-style: italic; color: #4a5568; }
    td code {
      font-family: "SF Mono", "Fira Code", monospace;
      font-size: 12px;
      padding: 2px 6px;
      background: #edf2f7;
      border-radius: 4px;
      color: #e53e3e;
    }
    .positive { color: #38a169; font-weight: 600; }
    .negative { color: #e53e3e; font-weight: 600; }
    .warning { color: #d69e2e; font-weight: 600; }
    tfoot td {
      padding: 12px 16px;
      font-weight: 600;
      background: #edf2f7;
      border-top: 2px solid #cbd5e0;
    }
    @media (max-width: 768px) {
      body { padding: 12px; }
      th, td { padding: 8px 10px; font-size: 13px; }
    }
  </style>
</head>
<body>
  <table>
    <thead><tr>${headerHtml}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 替换 Markdown 中的表格为图片标记
 */
export function replaceTablesWithMarkers(mdContent: string, tableImages: TableImage[]): string {
  let result = mdContent;

  // 从后往前替换，避免索引偏移
  const sortedImages = [...tableImages].sort((a, b) => b.index - a.index);

  for (const img of sortedImages) {
    const tables = extractTables(result);
    if (tables[img.index]) {
      const { startIndex, endIndex } = tables[img.index];
      const lines = result.split('\n');
      const before = lines.slice(0, startIndex);
      const after = lines.slice(endIndex + 1);
      result = [...before, img.marker, '', ...after].join('\n');
    }
  }

  return result;
}

/**
 * 使用 Playwright 渲染表格为图片（自动调整高度）
 */
export async function renderTableToImage(
  table: TableData,
  outputPath: string,
  options: RenderOptions = {}
): Promise<void> {
  const { width = 1000, outputFormat = 'png' } = options;

  // 动态导入 Playwright
  const { chromium } = await import('playwright');

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const html = generateTableHtml(table);
    await page.setContent(html);

    // 先设置一个初始高度
    await page.setViewportSize({ width, height: 800 });

    // 等待表格渲染完成
    await page.waitForSelector('table');

    // 获取表格实际高度并调整 viewport
    const tableHeight = await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = (globalThis as any).document;
      const table = doc?.querySelector('table');
      if (table) {
        const rect = table.getBoundingClientRect();
        return Math.ceil(rect.height) + 48; // 加上 padding
      }
      return 800;
    });

    // 调整 viewport 高度
    await page.setViewportSize({ width, height: tableHeight });

    // 截图
    const tableElement = await page.$('table');
    if (tableElement) {
      await tableElement.screenshot({
        path: outputPath,
        type: outputFormat,
      });
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * 渲染所有表格并返回图片路径
 */
export async function renderAllTables(
  mdContent: string,
  outputDir: string,
  options: RenderOptions = {}
): Promise<TableImage[]> {
  const tables = extractTables(mdContent);
  const results: TableImage[] = [];

  for (let i = 0; i < tables.length; i++) {
    const outputPath = `${outputDir}/table_${i}.png`;
    await renderTableToImage(tables[i].table, outputPath, options);
    results.push({
      index: i,
      fileId: `table_${i}`,
      marker: `<!-- TABLE_IMAGE_${i}:table_${i} -->`,
    });
  }

  return results;
}
