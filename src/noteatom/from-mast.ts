import type {
  MASTDocument,
  MASTBlockNode,
  MASTImageBlock,
  MASTParagraphBlock,
  MASTQuoteBlock,
  MASTInlineMarks,
} from '../mast/types.js';
import type {
  NoteAtomDoc,
  NoteAtomBlockNode,
  NoteAtomParagraph,
  NoteAtomImage,
  NoteAtomTextNode,
  NoteAtomMark,
} from './types.js';

/**
 * 将 MASTDocument 序列化为 NoteAtom JSON。
 * 所有 MASTImageBlock 必须已有 uuid（资源阶段完成后）。
 */
export function mastToNoteAtom(doc: MASTDocument): NoteAtomDoc {
  const content: NoteAtomBlockNode[] = [];

  for (const id of doc.topLevel) {
    const block = doc.blocks[id];
    const nodes = convertBlock(block, doc);
    content.push(...nodes);
  }

  return { type: 'doc', content };
}

// ── 块节点转换 ─────────────────────────────────────────────────────────────────

function convertBlock(block: MASTBlockNode, doc: MASTDocument): NoteAtomBlockNode[] {
  switch (block.type) {
    case 'paragraph':
      return [convertParagraph(block)];
    case 'quote':
      return [convertQuote(block, doc)];
    case 'image':
      return [convertImage(block)];
  }
}

function convertParagraph(block: MASTParagraphBlock): NoteAtomParagraph {
  return {
    type: 'paragraph',
    content: block.content.map(convertTextRun),
  };
}

function convertQuote(block: MASTQuoteBlock, doc: MASTDocument): NoteAtomBlockNode {
  const children: NoteAtomParagraph[] = [];

  for (const childId of block.children) {
    const child = doc.blocks[childId];
    if (child.type === 'paragraph') {
      children.push(convertParagraph(child));
    }
    // quote 内嵌套 quote：展平为段落
    else if (child.type === 'quote') {
      for (const grandChildId of child.children) {
        const grandChild = doc.blocks[grandChildId];
        if (grandChild.type === 'paragraph') {
          children.push(convertParagraph(grandChild));
        }
      }
    }
  }

  return { type: 'quote', content: children };
}

function convertImage(block: MASTImageBlock): NoteAtomImage {
  if (!block.uuid) {
    throw new Error(`MASTImageBlock ${block.id} has no uuid — run asset processing before serialization`);
  }
  return {
    type: 'image',
    attrs: {
      uuid: block.uuid,
      alt: block.alt,
      align: block.align,
    },
  };
}

// ── 行内节点转换 ───────────────────────────────────────────────────────────────

function convertTextRun(run: { type: 'text'; text: string; marks?: MASTInlineMarks }): NoteAtomTextNode {
  const node: NoteAtomTextNode = { type: 'text', text: run.text };

  if (!run.marks) return node;

  const marks: NoteAtomMark[] = [];

  // 按优先级顺序：code → strikethrough → bold → italic → link
  if (run.marks.code) marks.push({ type: 'code' });
  if (run.marks.strikethrough) marks.push({ type: 'strikethrough' });
  if (run.marks.bold) marks.push({ type: 'bold' });
  if (run.marks.italic) marks.push({ type: 'italic' });
  if (run.marks.link) marks.push({ type: 'link', attrs: { href: run.marks.link } });

  if (marks.length > 0) node.marks = marks;
  return node;
}
