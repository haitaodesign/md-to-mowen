# md-to-mowen 综合测试文档

本文档用于验证 md-to-mowen 流水线对各种 Markdown 格式的处理能力。

---

## 一、标题层级

# 一级标题（H1）

## 二级标题（H2）

### 三级标题（H3）

#### 四级标题（H4）

##### 五级标题（H5）

###### 六级标题（H6）

---

## 二、段落与行内格式

普通段落文字，包含**粗体**、_斜体_、**_粗斜体_**、~~删除线~~、`行内代码`。

带链接的段落：[墨问官网](https://mowen.cn)，以及[墨问 API 文档](https://mowen.apifox.cn/)。

多行段落：
第一行文字。
第二行文字（软换行）。

---

## 三、列表

### 无序列表

- 苹果
- 香蕉
- 橙子
  - 脐橙
  - 血橙
    - 进口血橙

### 有序列表

1. 第一步：安装依赖
2. 第二步：配置环境变量
3. 第三步：运行命令
   1. 先执行 dry-run
   2. 确认无误后正式发布

### 混合列表

- 功能模块
  1. 解析 Markdown
  2. 转换为 MAST
  3. 上传资源
- 配置项
  - API Key
  - 缓存目录

---

## 四、引用块

> 这是一段引用文字。

> 多行引用：
> 第一行引用内容。
> 第二行引用内容。

> 引用中包含**粗体**和`代码`格式。

---

## 五、代码块

### 行内代码

使用 `npm run test` 运行测试，使用 `git commit` 提交代码。

### 围栏代码块（无语言）

```
这是没有语言标注的代码块
第二行代码
第三行代码
```

### TypeScript 代码块

```typescript
interface MASTDocument {
  blocks: Record<string, MASTBlockNode>;
  topLevel: string[];
}

async function processFile(path: string): Promise<void> {
  const markdown = await readFile(path, 'utf8');
  const hast = mdToHast(markdown);
  const mast = hastToMast(hast);
  console.log('blocks:', Object.keys(mast.blocks).length);
}
```

### Shell 代码块

```bash
# 安装依赖
npm install

# dry-run 预览
md-to-mowen publish -i article.md --dry-run

# 正式发布
md-to-mowen publish -i article.md --tags "tech,ai"
```

### JSON 代码块

```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Hello, Mowen!" }]
    }
  ]
}
```

---

## 六、表格

### 简单表格

| 名称        | 类型     | 说明         |
| ----------- | -------- | ------------ |
| noteId      | string   | 笔记唯一 ID  |
| autoPublish | boolean  | 是否自动发布 |
| tags        | string[] | 标签列表     |

### 数字表格（测试右对齐渲染）

| 阶段        | 文件数 | 耗时（ms） | 成功率 |
| ----------- | ------ | ---------- | ------ |
| 01-hast     | 1      | 12         | 100%   |
| 02-mast     | 1      | 8          | 100%   |
| 03-assets   | 3      | 450        | 100%   |
| 04-noteatom | 1      | 3          | 100%   |
| 05-publish  | 1      | 320        | 100%   |

### 宽表格

| 字段     | 类型    | 必填 | 默认值   | 说明                  |
| -------- | ------- | ---- | -------- | --------------------- |
| fileType | integer | ✅   | —        | 1=图片，2=音频，3=PDF |
| fileName | string  | 否   | 自动生成 | 上传文件名            |
| url      | string  | ✅   | —        | 公网可访问的文件 URL  |

---

## 七、图片

### 本地图片

#### PNG 图片

![测试 PNG 图片](./assets/测试png.png)

#### JPG 图片

![测试 JPG 图片](./assets/测试jpg.jpg)

#### GIF 动图

![测试 GIF 动图](./assets/测试gif.gif)

#### WebP 图片

![测试 WebP 图片](./assets/测试webp.webp)

### 远程图片

![远程图片测试（本地替代）](./assets/测试png.png)

---

## 八、分隔线

上方内容

---

下方内容

---

另一种分隔线

---

## 九、特殊字符与转义

包含特殊字符：`<div>`、`&amp;`、`"引号"`、'单引号'。

转义字符：\*不是斜体\*、\`不是代码\`、\[不是链接\]。

Unicode 字符：中文、日本語、한국어、العربية、🎉。

---

## 十、音频

### 本地 MP3（含 ShowNote）

![audio: 00:00 开场白\n01:30 第一章：背景介绍\n05:00 第二章：核心概念\n12:00 第三章：实战演示\n20:00 总结](./assets/测试mp3.mp3)

### 本地 M4A

![audio: 00:00 M4A 音频测试](./assets/测试m4a.m4a)

---

## 十一、综合段落

这是一个综合测试段落，包含**粗体文字**、_斜体文字_、`代码片段`、~~删除线~~，
以及一个[超链接](https://mowen.cn)，还有***粗斜体***组合格式。

> 引用块中也可以有**粗体**、*斜体*和`代码`，
> 以及[链接](https://mowen.cn)。

最后一段：本文档覆盖了 md-to-mowen 支持的主要 Markdown 格式，
可用于端到端测试和视觉验收。
