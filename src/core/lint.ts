/**
 * 墨问发布质量检查模块
 *
 * 检查项：
 * 1. 配图检查 - 必须有封面图
 * 2. 表格检查 - 有表格必须已转换
 * 3. 标题层级 - H1→H2→H3，不能跳级
 * 4. 文章长度 - 建议 500-10000 字
 * 5. 特殊标记 - 检查是否有未处理的标记
 */

export interface LintResult {
  passed: boolean;
  message: string;
  details: string;
}

export interface LintReport {
  passed: boolean;
  results: LintResult[];
  summary: string;
}

interface LintOptions {
  hasCover?: boolean;
  hasTableImages?: boolean;
  minChars?: number;
  maxChars?: number;
  strict?: boolean;
}

/**
 * 检查 1: 配图检查
 */
function checkCoverImage(mdContent: string, hasCover: boolean): LintResult {
  if (hasCover) {
    return { passed: true, message: '配图检查通过', details: '已提供封面图' };
  }

  // 检查文章中是否有图片标记
  const imagePattern = /!\[.*?\]\(.*?\)|<!-- TABLE_IMAGE_\d+:[a-zA-Z0-9_-]+ -->/;
  const hasImage = imagePattern.test(mdContent);

  if (hasImage) {
    return { passed: true, message: '配图检查通过', details: '文章包含图片' };
  }

  return {
    passed: false,
    message: '配图检查失败',
    details: '文章没有配图，建议使用 GLM-Image 生成封面图',
  };
}

/**
 * 检查 2: 表格处理检查
 */
function checkTablesConverted(mdContent: string, hasTableImages: boolean): LintResult {
  // 提取原文中的所有表格（更宽松的匹配）
  const tablePattern =
    /(?:\|.+\|(?:\n|\r\n))+\|(?:[-:]+[-| :]+)\|(?:\n|\r\n)(?:\|.+\|(?:\n|\r\n)?)+/g;
  const originalTables = mdContent.match(tablePattern) || [];

  // 检查是否有表格图片标记
  const tableImageMarkers = mdContent.match(/<!-- TABLE_IMAGE_\d+:[a-zA-Z0-9_-]+ -->/g) || [];

  if (originalTables.length === 0) {
    return { passed: true, message: '表格检查通过', details: '文章没有表格，无需转换' };
  }

  if (tableImageMarkers.length > 0 || hasTableImages) {
    const convertedCount = Math.max(tableImageMarkers.length, hasTableImages ? 1 : 0);
    return {
      passed: true,
      message: '表格检查通过',
      details: `检测到 ${originalTables.length} 个表格，已转换 ${convertedCount} 个为图片`,
    };
  }

  return {
    passed: false,
    message: '表格检查失败',
    details: `检测到 ${originalTables.length} 个表格，但未转换为图片（墨问不支持原生表格渲染）`,
  };
}

/**
 * 检查 3: 标题层级检查
 */
function checkHeadingHierarchy(mdContent: string): LintResult {
  const lines = mdContent.split('\n');
  const headings: Array<{ level: number; text: string; line: number }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#')) {
      const match = line.match(/^(#+)\s+(.*)/);
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2].trim(),
          line: i + 1,
        });
      }
    }
  }

  if (headings.length === 0) {
    return { passed: true, message: '标题层级检查通过', details: '文章没有标题' };
  }

  // 检查是否从 H1 开始
  if (headings[0].level !== 1) {
    return {
      passed: false,
      message: '标题层级检查失败',
      details: `文章应该从 H1 标题开始，但第一个标题是 H${headings[0].level}: "${headings[0].text}"`,
    };
  }

  // 检查是否有跳级
  const issues: string[] = [];
  for (let i = 1; i < headings.length; i++) {
    const prevLevel = headings[i - 1].level;
    const currLevel = headings[i].level;

    if (currLevel > prevLevel + 1) {
      issues.push(
        `第 ${headings[i].line} 行：H${prevLevel} 后直接跳到 H${currLevel} ("${headings[i].text}")`
      );
    }
  }

  if (issues.length > 0) {
    return {
      passed: false,
      message: '标题层级检查失败',
      details: '发现标题跳级：\n' + issues.join('\n'),
    };
  }

  const maxLevel = Math.max(...headings.map((h) => h.level));
  return {
    passed: true,
    message: '标题层级检查通过',
    details: `共 ${headings.length} 个标题，层级正确 (H1→H${maxLevel})`,
  };
}

/**
 * 检查 4: 文章长度检查
 */
function checkArticleLength(mdContent: string, minChars: number, maxChars: number): LintResult {
  // 移除 markdown 标记，计算纯文本长度
  let textOnly = mdContent.replace(/[#*`~[\]()>-]/g, '');
  textOnly = textOnly.replace(/\s+/g, ' ').trim();
  const charCount = textOnly.length;

  if (charCount < minChars) {
    return {
      passed: false,
      message: '文章长度检查失败',
      details: `文章过短：${charCount} 字（建议至少 ${minChars} 字）`,
    };
  }

  if (charCount > maxChars) {
    return {
      passed: false,
      message: '文章长度检查失败',
      details: `文章过长：${charCount} 字（建议不超过 ${maxChars} 字）`,
    };
  }

  return {
    passed: true,
    message: '文章长度检查通过',
    details: `文章长度：${charCount} 字（建议范围：${minChars}-${maxChars} 字）`,
  };
}

/**
 * 检查 5: 特殊标记检查
 */
function checkUnprocessedMarkers(mdContent: string): LintResult {
  const issues: string[] = [];

  const placeholders = [
    { pattern: /\[TODO.*?\]/gi, name: 'TODO 占位符' },
    { pattern: /\[FIXME.*?\]/gi, name: 'FIXME 占位符' },
    { pattern: /\[XXX.*?\]/gi, name: 'XXX 占位符' },
    { pattern: /__TODO__/gi, name: 'TODO 标记' },
  ];

  for (const { pattern, name } of placeholders) {
    const matches = mdContent.match(pattern);
    if (matches) {
      issues.push(`发现 ${name}: ${matches[0]}`);
    }
  }

  if (issues.length > 0) {
    return {
      passed: false,
      message: '特殊标记检查失败',
      details: '发现未处理的标记：\n' + issues.join('\n'),
    };
  }

  return { passed: true, message: '特殊标记检查通过', details: '没有发现未处理的标记' };
}

/**
 * 运行所有检查
 */
export function lint(mdContent: string, options: LintOptions = {}): LintReport {
  const {
    hasCover = false,
    hasTableImages = false,
    minChars = 500, // 与原仓库一致
    maxChars = 10000,
    strict = false,
  } = options;

  const results: LintResult[] = [];

  results.push(checkCoverImage(mdContent, hasCover));
  results.push(checkTablesConverted(mdContent, hasTableImages));
  results.push(checkHeadingHierarchy(mdContent));
  results.push(checkArticleLength(mdContent, minChars, maxChars));
  results.push(checkUnprocessedMarkers(mdContent));

  // strict 模式：所有检查必须通过
  // 非 strict 模式：只有配图和表格检查是阻塞项
  const passed = strict ? results.every((r) => r.passed) : results[0].passed && results[1].passed; // 配图和表格必须通过

  const passedCount = results.filter((r) => r.passed).length;
  const summary = `${passedCount}/${results.length} 通过`;

  return { passed, results, summary };
}
