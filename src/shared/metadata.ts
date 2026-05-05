import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

const METADATA_FILENAME = 'metadata.json';

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

/** 读取元数据，文件不存在或损坏时返回空 store */
export function readMetadata(filePath: string): MetadataStore {
  if (!existsSync(filePath)) return emptyStore();

  try {
    const raw = readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);

    if (data && typeof data === 'object' && data.version === 1 && typeof data.notes === 'object') {
      return data as MetadataStore;
    }

    console.warn(`警告：元数据文件格式异常，已重新创建：${filePath}`);
    return emptyStore();
  } catch {
    console.warn(`警告：元数据文件解析失败，已重新创建：${filePath}`);
    return emptyStore();
  }
}

/** 写入元数据（同步写入，保证简单可靠） */
export function writeMetadata(filePath: string, store: MetadataStore): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, JSON.stringify(store, null, 2) + '\n', 'utf8');
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
