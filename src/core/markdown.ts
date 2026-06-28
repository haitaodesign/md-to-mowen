/**
 * Markdown → NoteAtom 转换模块
 *
 * 将 Markdown 文章转换为墨问 NoteAtom JSON 格式
 */

import { readFileSync } from 'fs';
import type { NoteAtomDoc, NoteAtomNode, NoteAtomInline } from '../index.js';

interface ConvertOptions {
  coverImageId?: string;
  tableImages?: Array<{ index: number; fileId: string }>;
}

/**
 * 清理文本中的 markdown 格式标记（保留链接）
 */
function cleanText(text: string): string {
  // 移除粗体标记 **text**
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  // 移除行内代码标记 `code`
  text = text.replace(/`(.*?)`/g, '$1');
  // 移除斜体标记 *text*
  text = text.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '$1');
  // 移除删除标记 ~~text~~
  text = text.replace(/~~(.*?)~~/g, '$1');
  return text;
}

/**
 * 解析段落中的内联元素（链接、粗体等）
 *
 * 将 markdown 链接 [text](url) 转换为 NoteAtom 链接节点
 * 将裸 URL 转换为可点击链接
 */
function parseInlineContent(text: string): NoteAtomInline[] {
  const content: NoteAtomInline[] = [];

  // 匹配 markdown 链接 [text](url) 和裸 URL
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s]+)/g;

  let lastEnd = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // 添加链接前的普通文本
    if (match.index > lastEnd) {
      const plainText = text.slice(lastEnd, match.index);
      if (plainText) {
        content.push({ type: 'text', text: plainText });
      }
    }

    if (match[1] && match[2]) {
      // markdown 链接 [text](url)
      content.push({
        type: 'text',
        text: match[1],
        marks: [{ type: 'link', attrs: { href: match[2] } }],
      });
    } else if (match[3]) {
      // 裸 URL
      content.push({
        type: 'text',
        text: match[3],
        marks: [{ type: 'link', attrs: { href: match[3] } }],
      });
    }

    lastEnd = match.index + match[0].length;
  }

  // 添加剩余文本
  if (lastEnd < text.length) {
    const remaining = text.slice(lastEnd);
    if (remaining) {
      content.push({ type: 'text', text: remaining });
    }
  }

  return content.length > 0 ? content : [{ type: 'text', text }];
}

/**
 * 创建图片节点
 */
function createImageNode(fileId: string): NoteAtomNode {
  return {
    type: 'image',
    attrs: { uuid: fileId, alt: '', align: 'center' },
  };
}

/**
 * 将 Markdown 内容转换为 NoteAtom 格式
 */
export function markdownToNoteAtom(mdContent: string, options: ConvertOptions = {}): NoteAtomDoc {
  const content: NoteAtomNode[] = [];

  // 如果有封面图，插入为第一个元素
  if (options.coverImageId) {
    content.push(createImageNode(options.coverImageId));
  }

  // 构建表格图片映射
  const tableImageMap = new Map<string, string>();
  if (options.tableImages) {
    for (const img of options.tableImages) {
      const marker = `<!-- TABLE_IMAGE_${img.index}:${img.fileId} -->`;
      tableImageMap.set(marker.trim(), img.fileId);
    }
  }

  const lines = mdContent.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 跳过空行但保留段落分隔
    if (!line.trim()) {
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text: '' }],
      });
      continue;
    }

    // 检查是否是表格图片标记
    if (line.trim().startsWith('<!-- TABLE_IMAGE_') && line.includes('-->')) {
      const markerMatch = line.match(/TABLE_IMAGE_\d+:([a-zA-Z0-9_-]+)/);
      if (markerMatch) {
        content.push(createImageNode(markerMatch[1]));
      }
      continue;
    }

    // H1 标题 (# Title)
    if (line.startsWith('# ')) {
      const text = cleanText(line.slice(2).trim());
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text, marks: [{ type: 'bold' }] }],
      });
    }
    // H2 标题 (## Title)
    else if (line.startsWith('## ')) {
      const text = cleanText(line.slice(3).trim());
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text, marks: [{ type: 'bold' }] }],
      });
    }
    // H3 标题 (### Title)
    else if (line.startsWith('### ')) {
      const text = cleanText(line.slice(4).trim());
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text }],
      });
    }
    // 引用块 (> text)
    else if (line.startsWith('> ')) {
      const text = cleanText(line.slice(2).trim());
      content.push({
        type: 'quote',
        content: [{ type: 'paragraph', content: parseInlineContent(text) }],
      });
    }
    // 列表项 (- text)
    else if (line.startsWith('- ')) {
      const text = cleanText(line.slice(2).trim());
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text: '• ' }, ...parseInlineContent(text)],
      });
    }
    // 分隔线 (---)
    else if (line.startsWith('---')) {
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text: '' }],
      });
    }
    // 普通段落
    else {
      const text = cleanText(line.trim());
      // 跳过表格图片标记行
      if (!(text.startsWith('<!-- TABLE_IMAGE_') && text.includes('-->'))) {
        content.push({
          type: 'paragraph',
          content: parseInlineContent(text),
        });
      }
    }
  }

  return { type: 'doc', content };
}

/**
 * 从文件读取 Markdown 并转换为 NoteAtom
 */
export function convertFile(filePath: string, options: ConvertOptions = {}): NoteAtomDoc {
  const mdContent = readFileSync(filePath, 'utf-8');
  return markdownToNoteAtom(mdContent, options);
}
