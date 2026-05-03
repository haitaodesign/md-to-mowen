/**
 * NoteAtom 类型定义
 * 墨问的 ProseMirror 风格文档格式
 */

export interface NoteAtomDoc {
  type: 'doc';
  content: NoteAtomBlockNode[];
}

export type NoteAtomBlockNode = NoteAtomParagraph | NoteAtomQuote | NoteAtomImage;

export interface NoteAtomParagraph {
  type: 'paragraph';
  content: NoteAtomTextNode[];
}

export interface NoteAtomQuote {
  type: 'quote';
  content: NoteAtomParagraph[];
}

export interface NoteAtomImage {
  type: 'image';
  attrs: {
    uuid: string;
    alt: string;
    align: 'left' | 'center' | 'right';
  };
}

export interface NoteAtomTextNode {
  type: 'text';
  text: string;
  marks?: NoteAtomMark[];
}

export type NoteAtomMark =
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'code' }
  | { type: 'strikethrough' }
  | { type: 'link'; attrs: { href: string } };
