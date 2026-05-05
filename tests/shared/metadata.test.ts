import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  readMetadata,
  writeMetadata,
  lookupNote,
  upsertNote,
  findMetadataPath,
  type MetadataStore,
} from '../../src/shared/metadata.js';

let testDir: string;

beforeEach(async () => {
  testDir = join(tmpdir(), `meta-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(testDir, { recursive: true });
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

// ── readMetadata ─────────────────────────────────────────────────────────────

describe('readMetadata', () => {
  it('文件不存在时返回空 store', () => {
    const store = readMetadata(join(testDir, 'nope.json'));
    expect(store).toEqual({ version: 1, notes: {} });
  });

  it('正常读取已有元数据', async () => {
    const filePath = join(testDir, 'metadata.json');
    const data: MetadataStore = {
      version: 1,
      notes: {
        '/path/to/file.md': { noteId: 'abc', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
      },
    };
    await writeFile(filePath, JSON.stringify(data), 'utf8');

    const store = readMetadata(filePath);
    expect(store.notes['/path/to/file.md']?.noteId).toBe('abc');
  });

  it('JSON 损坏时返回空 store 并打印警告', async () => {
    const filePath = join(testDir, 'bad.json');
    await writeFile(filePath, '{ broken json!!!', 'utf8');

    const consoleSpy = { warn: console.warn };
    const warnings: string[] = [];
    console.warn = (msg: string) => warnings.push(msg);

    const store = readMetadata(filePath);
    expect(store).toEqual({ version: 1, notes: {} });
    expect(warnings.some((w) => w.includes('解析失败'))).toBe(true);

    console.warn = consoleSpy.warn;
  });

  it('version 字段缺失时返回空 store', async () => {
    const filePath = join(testDir, 'no-version.json');
    await writeFile(filePath, JSON.stringify({ notes: {} }), 'utf8');

    const store = readMetadata(filePath);
    expect(store).toEqual({ version: 1, notes: {} });
  });

  it('notes 字段非对象时返回空 store', async () => {
    const filePath = join(testDir, 'wrong-type.json');
    await writeFile(filePath, JSON.stringify({ version: 1, notes: 'bad' }), 'utf8');

    const store = readMetadata(filePath);
    expect(store).toEqual({ version: 1, notes: {} });
  });
});

// ── writeMetadata ────────────────────────────────────────────────────────────

describe('writeMetadata', () => {
  it('写入并能重新读取', async () => {
    const filePath = join(testDir, 'metadata.json');
    const store: MetadataStore = { version: 1, notes: {} };
    upsertNote(store, '/a.md', 'id-1');

    writeMetadata(filePath, store);

    const reloaded = readMetadata(filePath);
    expect(reloaded.notes['/a.md']?.noteId).toBe('id-1');
  });

  it('自动创建目录', async () => {
    const filePath = join(testDir, 'deep', 'nested', 'metadata.json');
    const store: MetadataStore = { version: 1, notes: {} };

    writeMetadata(filePath, store);

    const content = await readFile(filePath, 'utf8');
    expect(JSON.parse(content).version).toBe(1);
  });
});

// ── lookupNote ───────────────────────────────────────────────────────────────

describe('lookupNote', () => {
  it('找到已有记录', () => {
    const store: MetadataStore = {
      version: 1,
      notes: {
        '/a.md': { noteId: 'x', createdAt: '', updatedAt: '' },
      },
    };
    expect(lookupNote(store, '/a.md')).toEqual({ noteId: 'x', createdAt: '', updatedAt: '' });
  });

  it('找不到时返回 undefined', () => {
    const store: MetadataStore = { version: 1, notes: {} };
    expect(lookupNote(store, '/missing.md')).toBeUndefined();
  });
});

// ── upsertNote ──────────────────────────────────────────────────────────────

describe('upsertNote', () => {
  it('新增记录', () => {
    const store: MetadataStore = { version: 1, notes: {} };
    upsertNote(store, '/new.md', 'id-new');

    expect(store.notes['/new.md']?.noteId).toBe('id-new');
    expect(store.notes['/new.md']?.createdAt).toBeTruthy();
    expect(store.notes['/new.md']?.createdAt).toBe(store.notes['/new.md']?.updatedAt);
  });

  it('更新已有记录，保留 createdAt', () => {
    const store: MetadataStore = {
      version: 1,
      notes: {
        '/existing.md': { noteId: 'old-id', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      },
    };

    upsertNote(store, '/existing.md', 'new-id');

    expect(store.notes['/existing.md']?.noteId).toBe('new-id');
    expect(store.notes['/existing.md']?.createdAt).toBe('2026-01-01T00:00:00Z');
    expect(store.notes['/existing.md']?.updatedAt).not.toBe('2026-01-01T00:00:00Z');
  });
});

// ── findMetadataPath ────────────────────────────────────────────────────────

describe('findMetadataPath', () => {
  it('项目级存在时优先返回项目级', async () => {
    const projectDir = join(testDir, 'project');
    const userDir = join(testDir, 'user');
    await mkdir(join(projectDir, '.md-to-mowen'), { recursive: true });
    await mkdir(join(userDir, '.md-to-mowen'), { recursive: true });
    await writeFile(join(projectDir, '.md-to-mowen', 'metadata.json'), '{}', 'utf8');
    await writeFile(join(userDir, '.md-to-mowen', 'metadata.json'), '{}', 'utf8');

    // findMetadataPath 不直接支持自定义 user home，这里只验证项目级优先
    const path = findMetadataPath(projectDir);
    expect(path).toContain('project');
  });

  it('项目级不存在时返回项目级路径（待创建）', () => {
    const projectDir = join(testDir, 'empty-project');
    const path = findMetadataPath(projectDir);
    expect(path).toContain('empty-project');
  });
});
