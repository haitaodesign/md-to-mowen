# mowen-publish

墨问文章发布 CLI 工具，支持一键发布 Markdown 文章到墨问平台。

## 使用方式

### 发布文章

```bash
# 基本发布
mowen-publish publish article.md

# 指定封面图
mowen-publish publish article.md --cover cover.png

# 严格模式（质量检查失败则阻塞发布）
mowen-publish publish article.md --strict

# 跳过表格转换
mowen-publish publish article.md --no-table
```

### 检查文章质量

```bash
# 基本检查
mowen-publish lint article.md

# 严格模式
mowen-publish lint article.md --strict

# 自定义字数范围
mowen-publish lint article.md --min-chars 200 --max-chars 5000
```

### 上传图片

```bash
mowen-publish upload image.png
```

## 配置

### API Key

设置环境变量：

```bash
export MOWEN_API_KEY=your-api-key
```

或在命令中指定：

```bash
mowen-publish publish article.md --api-key your-api-key
```

## 质量检查项

1. **配图检查** - 必须有封面图或内嵌图片
2. **表格检查** - 有表格必须已转换为图片
3. **标题层级** - H1→H2→H3，不能跳级
4. **文章长度** - 建议 100-10000 字
5. **特殊标记** - 无 TODO/FIXME 等占位符
