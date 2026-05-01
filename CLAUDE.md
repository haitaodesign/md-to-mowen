# md-to-mowen — Claude 工作手册

## 项目概述

TypeScript/Node.js CLI 工具，通过墨问开放 API 将 Markdown（GFM）转换为墨问笔记。

详细架构见 [docs/CONCEPT.md](docs/CONCEPT.md)（按需阅读，非必须全部加载）。

---

## 分支与版本规则

| 分支类型 | 命名规则 | 说明 |
|---|---|---|
| 长期开发分支 | `dev` | 所有特征分支从此分叉，PR 合回此处 |
| 特征分支 | `{issueId}-{slug}` | 示例：`42-支持代码块渲染` |
| 发布分支 | `main` | 只接受来自 `dev` 的 PR，合并后自动发布 |

版本号由 **semantic-release** 全自动管理，禁止手动修改版本号：
- `feat:` 提交 → 升 **minor**（1.x.0）
- `fix:` 提交 → 升 **patch**（1.0.x）
- 合并到 `main` → CI 自动打 tag、生成 CHANGELOG、发布到 npm

---

## Issue 驱动开发流程

1. **开 Issue**：用简体中文描述问题，包含：
   - 背景与动机
   - 验收标准（明确、可测试）
2. **写测试**：测试工程师依据验收标准编写测试用例（先于代码）
3. **写代码**：开发工程师实现功能，测试全部通过后方可提 PR
4. **PR**：从特征分支提到 `dev`，标题格式 `fix/feat: 简述 (#issueId)`

> Issue 标题、分支 slug、PR 标题均使用**简体中文**。

---

## 提交信息规范

```
feat: 支持代码块渲染为图片
fix: 修复表格上传后 uuid 为空的问题
chore: 更新依赖
docs: 补充 API 集成说明
test: 增加 MAST 序列化单元测试
```

---

## 环境变量

见 `.env.example`：

```env
DEV_HOME=/home/yourname        # 本机 home 目录，用于展开参考路径
MOWEN_API_KEY=...              # 墨问开放平台 API Key
```

---

## 关键文档索引（按需加载）

| 文档 | 内容 | 何时读 |
|---|---|---|
| `docs/CONCEPT.md` | 完整架构、NoteAtom 类型系统、流水线、API 集成 | 实现新功能前 |
| `.env.example` | 环境变量清单 | 初次配置环境时 |
| `CHANGELOG.md` | 版本历史 | 排查回归问题时 |
