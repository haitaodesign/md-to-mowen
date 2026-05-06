import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  openSync,
  writeSync,
  fsyncSync,
  closeSync,
  renameSync,
  unlinkSync,
} from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

const METADATA_FILENAME = 'metadata.json';
const TMP_SUFFIX = '.tmp';
const BAK_SUFFIX = '.bak';

export interface NoteRecord {
  noteId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetadataStore {
  version: 1;
  notes: Record<string, NoteRecord>;
}

function emptyStore(): MetadataStore {
  return { version: 1, notes: {} };
}

/**
 * 查找元数据文件路径（项目级优先于用户级）。
 * 项目级：CWD/.md-to-mowen/metadata.json
 * 用户级：~/.md-to-mowen/metadata.json
 */
export function findMetadataPath(projectRoot?: string): string {
  const projectDir = projectRoot ?? process.cwd();
  const projectPath = join(projectDir, '.md-to-mowen', METADATA_FILENAME);
  const userPath = join(homedir(), '.md-to-mowen', METADATA_FILENAME);

  if (existsSync(projectPath)) return projectPath;
  if (existsSync(userPath)) return userPath;
  // 默认写入项目级
  return projectPath;
}

/** 尝试解析元数据文件，返回解析结果或 null */
function tryParseMetadata(filePath: string): MetadataStore | null {
  if (!existsSync(filePath)) return null;

  try {
    const raw = readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);

    if (data && typeof data === 'object' && data.version === 1 && typeof data.notes === 'object') {
      return data as MetadataStore;
    }

    return null;
  } catch {
    return null;
  }
}

/** 读取元数据，文件不存在或损坏时返回空 store */
export function readMetadata(filePath: string): MetadataStore {
  // 优先尝试读取主文件
  const mainData = tryParseMetadata(filePath);
  if (mainData) return mainData;

  // 主文件不存在或损坏，尝试读取备份
  const bakPath = filePath + BAK_SUFFIX;
  const bakData = tryParseMetadata(bakPath);
  if (bakData) {
    console.warn(`警告：元数据文件损坏，已从备份恢复：${filePath}`);
    return bakData;
  }

  // 主文件和备份都不存在或都损坏
  if (existsSync(filePath)) {
    console.warn(`警告：元数据文件及备份均损坏，已重新创建：${filePath}`);
  }
  return emptyStore();
}

/** 原子写入元数据：先写临时文件，fsync 后再 rename */
export function writeMetadata(filePath: string, store: MetadataStore): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const tmpPath = filePath + TMP_SUFFIX;
  const bakPath = filePath + BAK_SUFFIX;
  const content = JSON.stringify(store, null, 2) + '\n';

  // 1. 写入临时文件
  let fd: number | undefined;
  try {
    fd = openSync(tmpPath, 'w');
    writeSync(fd, content, 0, 'utf8');
    // 2. fsync 确保落盘
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;

    // 3. 将现有文件重命名为备份（如果存在）
    if (existsSync(filePath)) {
      // 删除旧备份（不累积历史版本）
      if (existsSync(bakPath)) {
        unlinkSync(bakPath);
      }
      renameSync(filePath, bakPath);
    }

    // 4. 将临时文件重命名为正式文件
    renameSync(tmpPath, filePath);
  } finally {
    // 确保 fd 被关闭（如果中途出错）
    if (fd !== undefined) {
      try {
        closeSync(fd);
      } catch {
        /* ignore */
      }
    }
    // 清理临时文件（如果写入失败且临时文件残留）
    if (existsSync(tmpPath)) {
      try {
        unlinkSync(tmpPath);
      } catch {
        /* ignore */
      }
    }
  }
}

/** 根据绝对路径查找已有记录 */
export function lookupNote(store: MetadataStore, absPath: string): NoteRecord | undefined {
  return store.notes[absPath];
}

/** 更新或新增一条记录 */
export function upsertNote(store: MetadataStore, absPath: string, noteId: string): void {
  const now = new Date().toISOString();
  const existing = store.notes[absPath];

  if (existing) {
    store.notes[absPath] = { ...existing, noteId, updatedAt: now };
  } else {
    store.notes[absPath] = { noteId, createdAt: now, updatedAt: now };
  }
}
