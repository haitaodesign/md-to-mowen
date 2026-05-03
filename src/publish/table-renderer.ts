import { chromium } from 'playwright';

/**
 * 将 Markdown 表格语法渲染为 PNG Buffer。
 * HTML/CSS 模板参考 table2image_pro.py（专业金融风格）。
 */
export async function renderTableToPng(tableMarkdown: string): Promise<Buffer> {
  const html = buildTableHtml(tableMarkdown);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.setContent(html, { waitUntil: 'networkidle' });

    const element = await page.$('table');
    if (!element) throw new Error('Table element not found in rendered HTML');

    const buffer = await element.screenshot({ type: 'png' });
    return Buffer.from(buffer);
  } finally {
    await browser.close();
  }
}

// ── HTML 生成 ─────────────────────────────────────────────────────────────────

function buildTableHtml(markdown: string): string {
  const { headers, rows } = parseMarkdownTable(markdown);
  const headerHtml = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const rowsHtml = rows
    .map((row) => {
      const cells = row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    margin: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
    background: #fff;
  }
  table {
    border-collapse: collapse;
    width: 1000px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    font-size: 14px;
  }
  thead tr {
    background: linear-gradient(135deg, #1e3a5f, #2d4a6f);
  }
  thead th {
    color: #fff;
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    letter-spacing: 0.3px;
  }
  tbody tr:nth-child(odd) {
    background: #fafbfc;
  }
  tbody tr:nth-child(even) {
    background: #ffffff;
  }
  tbody tr:hover {
    background: #eef3f9;
  }
  tbody td {
    padding: 10px 16px;
    color: #2c3e50;
    border-bottom: 1px solid #e8ecf0;
  }
  tbody td:last-child, thead th:last-child {
    border-right: none;
  }
  /* 数字列右对齐 */
  tbody td.num {
    text-align: right;
    font-family: 'SF Mono', 'Menlo', monospace;
  }
</style>
</head>
<body>
<table>
  <thead><tr>${headerHtml}</tr></thead>
  <tbody>${rowsHtml}</tbody>
</table>
</body>
</html>`;
}

function parseMarkdownTable(markdown: string): { headers: string[]; rows: string[][] } {
  const lines = markdown.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line: string) =>
    line
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => c.trim());

  const headers = parseRow(lines[0]);
  // lines[1] is the separator row (---|---)
  const rows = lines.slice(2).map(parseRow);

  return { headers, rows };
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
