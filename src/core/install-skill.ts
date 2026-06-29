import { existsSync, mkdirSync, readdirSync, copyFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface ToolInfo {
  name: string;
  userDir: string;
  projectDir: string;
}

export interface InstallOptions {
  level?: 'user' | 'project';
  tool?: string;
}

// 支持的 AI 工具及其路径
const TOOLS: Record<string, ToolInfo> = {
  claude: {
    name: 'Claude Code',
    userDir: join(homedir(), '.claude', 'skills'),
    projectDir: '.claude/skills',
  },
  cursor: {
    name: 'Cursor',
    userDir: join(homedir(), '.cursor', 'skills'),
    projectDir: '.cursor/skills',
  },
};

/**
 * 检测已安装的 AI 工具
 */
export function detectTools(): ToolInfo[] {
  const detected: ToolInfo[] = [];

  for (const tool of Object.values(TOOLS)) {
    // 检查用户级目录是否存在
    if (existsSync(tool.userDir)) {
      detected.push(tool);
      continue;
    }
    // 检查项目级目录是否存在
    if (existsSync(tool.projectDir)) {
      detected.push(tool);
    }
  }

  return detected;
}

/**
 * 获取技能源目录（npm 包内的 skills/ 目录）
 */
export function getSkillSourceDir(): string {
  // 从 dist/core/ 向上找到包根目录
  return join(__dirname, '..', '..', 'skills', 'mowen');
}

/**
 * 获取技能目标目录
 */
export function getSkillTargetDir(tool: ToolInfo, level: 'user' | 'project'): string {
  const baseDir = level === 'user' ? tool.userDir : tool.projectDir;
  return join(baseDir, 'mowen');
}

/**
 * 检查是否已有技能安装
 */
export function checkExisting(targetDir: string): { exists: boolean; version?: string } {
  const skillFile = join(targetDir, 'SKILL.md');

  if (!existsSync(skillFile)) {
    return { exists: false };
  }

  // 尝试从文件中提取版本
  try {
    const content = readFileSync(skillFile, 'utf8');
    const versionMatch = content.match(/version:\s*(\d+\.\d+\.\d+)/i);
    return {
      exists: true,
      version: versionMatch ? versionMatch[1] : 'unknown',
    };
  } catch {
    return { exists: true };
  }
}

/**
 * 安装技能到指定目录
 */
export function installSkill(targetDir: string): void {
  const sourceDir = getSkillSourceDir();

  if (!existsSync(sourceDir)) {
    throw new Error(`技能源目录不存在: ${sourceDir}`);
  }

  // 创建目标目录
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  // 复制文件
  copyDir(sourceDir, targetDir);
}

/**
 * 递归复制目录
 */
function copyDir(src: string, dest: string): void {
  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      if (!existsSync(destPath)) {
        mkdirSync(destPath, { recursive: true });
      }
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}
