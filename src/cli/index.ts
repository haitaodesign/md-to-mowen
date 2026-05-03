import { Command } from 'commander';
import { config } from 'dotenv';
import { processFile } from '../publish/process-file.js';
import { MowenClient } from '../mowen/client.js';
import { noteAtomToMast } from '../noteatom/to-mast.js';
import { mastToMarkdown } from '../mast/to-markdown.js';
import { readFile, writeFile } from 'fs/promises';

config(); // 加载 .env

const program = new Command();

program.name('md-to-mowen').description('将 Markdown（GFM）转换为墨问笔记').version('0.0.0');

// ── publish ────────────────────────────────────────────────────────────────────

program
  .command('publish')
  .description('发布 Markdown 文件为墨问笔记')
  .requiredOption('-i, --input <file>', 'Markdown 文件路径')
  .option('--note-id <id>', '已有笔记 ID（编辑模式，全量替换）')
  .option('--tags <tags>', '标签，逗号分隔（如 "tech,ai"）')
  .option('--auto-publish', '自动发布（非草稿）', false)
  .option('--dry-run', '走完流水线但不调用墨问 API，仅打印统计', false)
  .option('--cache-dir <dir>', '保存各阶段产物的目录（调试用）', 'out/pipeline-cache')
  .action(async (opts) => {
    const apiKey = process.env.MOWEN_API_KEY;
    if (!apiKey && !opts.dryRun) {
      console.error('错误：未设置 MOWEN_API_KEY 环境变量。');
      console.error('请在 .env 文件中添加：MOWEN_API_KEY=your_key');
      process.exit(1);
    }

    const client = new MowenClient(apiKey ?? 'dry-run-placeholder');
    const tags = opts.tags ? (opts.tags as string).split(',').map((t: string) => t.trim()) : undefined;

    try {
      const result = await processFile(opts.input, client, {
        ...(opts.noteId ? { noteId: opts.noteId } : {}),
        ...(tags ? { tags } : {}),
        autoPublish: opts.autoPublish,
        dryRun: opts.dryRun,
        ...(opts.cacheDir ? { cacheDir: opts.cacheDir } : {}),
      });

      if (!result.dryRun) {
        console.log(`\n✅ 发布成功`);
        console.log(`   笔记 ID：${result.noteId}`);
        console.log(`   访问地址：${result.noteUrl}\n`);
      }
    } catch (err) {
      console.error('发布失败：', err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

// ── to-markdown ────────────────────────────────────────────────────────────────

program
  .command('to-markdown')
  .description('将 NoteAtom JSON 转换为 Markdown')
  .requiredOption('-i, --input <file>', 'NoteAtom JSON 文件路径')
  .option('-o, --output <file>', '输出 Markdown 文件路径（不指定则输出到 stdout）')
  .action(async (opts) => {
    try {
      const raw = await readFile(opts.input, 'utf8');
      const noteAtom = JSON.parse(raw);

      if (!noteAtom.type || !Array.isArray(noteAtom.content)) {
        console.error('错误：无效的 NoteAtom JSON，缺少 type 或 content 字段。');
        process.exit(1);
      }

      const mast = noteAtomToMast(noteAtom);
      const md = mastToMarkdown(mast);

      if (opts.output) {
        await writeFile(opts.output, md, 'utf8');
        console.log(`✅ 已输出到 ${opts.output}`);
      } else {
        process.stdout.write(md);
      }
    } catch (err) {
      console.error('转换失败：', err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program.parse();
