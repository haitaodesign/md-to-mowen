import { noteAtomToMast } from '../src/noteatom/to-mast.js';
import { mastToMarkdown } from '../src/mast/to-markdown.js';
import { readFileSync } from 'fs';

const noteAtom = JSON.parse(readFileSync('out/pipeline-cache/04-noteatom.json', 'utf8'));
const mast = noteAtomToMast(noteAtom);
const md = mastToMarkdown(mast);
process.stdout.write(md);
