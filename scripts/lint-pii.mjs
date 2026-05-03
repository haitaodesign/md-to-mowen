#!/usr/bin/env node
/**
 * lint-pii.mjs — PII 防泄漏扫描脚本
 *
 * 扫描范围：src/**、docs/**、根目录 *.md、*.json（排除 package-lock.json）
 * 仅报错，不自动修改。
 *
 * 用法：
 *   node scripts/lint-pii.mjs            # 扫描全部 tracked 文件
 *   node scripts/lint-pii.mjs --staged   # 仅扫描 git staged 文件（pre-commit 用）
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { extname, basename } from 'path';

// ── 配置 ──────────────────────────────────────────────────────────────────────

const SCAN_PATTERNS = [/^src\//, /^docs\//, /^[^/]+\.(md|json)$/];
const EXCLUDE_FILES = ['package-lock.json'];

/** ERROR 规则：命中则 exit 1 */
const ERROR_RULES = [
  {
    id: 'P1',
    name: '绝对路径含 home 目录',
    // 匹配 /Users/xxx/ 或 /home/xxx/，排除 ${DEV_HOME}/ 这种已脱敏写法
    regex: /(?<!\$\{DEV_HOME\})\/(?:Users|home)\/[a-zA-Z0-9_.-]{2,}\//g,
    hint: '请替换为 ${DEV_HOME}/',
  },
  {
    id: 'P2',
    name: '疑似硬编码 API Key / Token',
    // 引号包裹的 24 字符以上的串，且必须包含数字（排除纯单词组合的配置 key 名）
    regex: /["'][A-Za-z0-9+/]{24,}["']/g,
    hint: '请将密钥写入 .env，代码中使用 process.env.YOUR_KEY',
    // 过滤：纯字母（camelCase 配置名）不算 token；URL 路径（以 / 开头的可读路径）不算 token
    filter: (match) => /[0-9]/.test(match) && !/^['"]\/[a-z]/.test(match),
  },
  {
    id: 'P3',
    name: '.env 文件被 git 追踪',
    // 在文件列表层面检查，非行内规则（见下方特殊处理）
    regex: null,
  },
];

/** WARNING 规则：命中仅打印，不阻断 */
const WARN_RULES = [
  {
    id: 'W1',
    name: '邮箱地址',
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    // 允许出现在 .env.example 和 package.json 的 author/contributors 字段
    skipFiles: ['.env.example'],
    hint: '如为作者信息请忽略，否则考虑移出代码库',
  },
  {
    id: 'W2',
    name: 'GitHub username 硬编码',
    regex: /github\.com\/[a-zA-Z0-9_-]{2,}(?:\/[a-zA-Z0-9_.-]+)?/g,
    hint: '确认是否需要写死，考虑提取为配置项',
  },
];

// ── 工具函数 ───────────────────────────────────────────────────────────────────

function getTrackedFiles(stagedOnly) {
  const cmd = stagedOnly ? 'git diff --cached --name-only --diff-filter=ACMR' : 'git ls-files';
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function shouldScan(filePath) {
  if (EXCLUDE_FILES.includes(basename(filePath))) return false;
  // 跳过二进制扩展
  const binaryExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.tgz'];
  if (binaryExts.includes(extname(filePath).toLowerCase())) return false;
  return SCAN_PATTERNS.some((pat) => pat.test(filePath));
}

function scanLine(filePath, lineNum, line, rules, severity) {
  const findings = [];
  for (const rule of rules) {
    if (!rule.regex) continue;
    if (rule.skipFiles && rule.skipFiles.some((f) => filePath.endsWith(f))) continue;

    // package.json 的 author/repository 字段放宽 W1/W2
    if (filePath === 'package.json' && (rule.id === 'W1' || rule.id === 'W2')) continue;

    const matches = [...line.matchAll(rule.regex)];
    for (const m of matches) {
      // 可选的额外过滤条件
      if (rule.filter && !rule.filter(m[0])) continue;
      findings.push({
        severity,
        id: rule.id,
        name: rule.name,
        file: filePath,
        line: lineNum,
        match: m[0],
        hint: rule.hint,
      });
    }
  }
  return findings;
}

// ── 主流程 ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const stagedOnly = args.includes('--staged');

const allFiles = getTrackedFiles(stagedOnly);
const filesToScan = allFiles.filter(shouldScan);

const allFindings = [];

// P3：检查 .env 是否被 track（精确匹配，排除 .env.example）
const trackedEnv = allFiles.filter((f) => /^\.env$/.test(f));
for (const f of trackedEnv) {
  allFindings.push({
    severity: 'ERROR',
    id: 'P3',
    name: '.env 文件被 git 追踪',
    file: f,
    line: 0,
    match: f,
    hint: '运行 git rm --cached .env 并确认 .gitignore 包含 .env',
  });
}

// 逐文件扫描
for (const filePath of filesToScan) {
  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    continue;
  }

  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    allFindings.push(
      ...scanLine(
        filePath,
        lineNum,
        line,
        ERROR_RULES.filter((r) => r.regex),
        'ERROR',
      ),
    );
    allFindings.push(...scanLine(filePath, lineNum, line, WARN_RULES, 'WARN'));
  });
}

// ── 输出 ───────────────────────────────────────────────────────────────────────

const errors = allFindings.filter((f) => f.severity === 'ERROR');
const warns = allFindings.filter((f) => f.severity === 'WARN');

if (warns.length > 0) {
  console.log('\n⚠️  PII 警告（不阻断提交）：\n');
  for (const f of warns) {
    const loc = f.line ? `${f.file}:${f.line}` : f.file;
    console.log(`  WARN  [${f.id}] ${loc}`);
    console.log(`        匹配：${f.match}`);
    console.log(`        提示：${f.hint}\n`);
  }
}

if (errors.length > 0) {
  console.error('\n🚨 PII 错误（阻断提交/CI）：\n');
  for (const f of errors) {
    const loc = f.line ? `${f.file}:${f.line}` : f.file;
    console.error(`  ERROR [${f.id}] ${loc}`);
    console.error(`        匹配：${f.match}`);
    console.error(`        修复：${f.hint}\n`);
  }
  console.error(`共 ${errors.length} 个 PII 错误，请修复后重新提交。\n`);
  process.exit(1);
}

if (warns.length === 0 && errors.length === 0) {
  console.log('✅ PII 检查通过。');
}
