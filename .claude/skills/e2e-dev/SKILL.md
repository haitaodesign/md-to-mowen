---
name: e2e-dev
description: >
  端到端开发闭环：从需求拆解到 Issue 关闭的全自动化流程。
  当用户说"端到端"、"e2e"、"帮我把这个需求做完"、"处理这个 issue"、
  "从头到尾搞定"、"全流程开发"时触发此 skill。
  支持输入 Issue 编号或需求描述文本。
---

# 端到端开发（e2e-dev）

以 Issue 为驱动，自动执行从需求拆解到代码合并、Issue 关闭的完整开发闭环。

## 输入

用户通过 `/e2e-dev` 调用时，提供以下任一输入：

- **Issue 编号**：如 `#7`，直接读取 Issue 内容
- **需求描述**：自由文本，skill 会先创建 Issue 再继续
- **无输入**：提示用户提供需求或 Issue 编号

## 流程总览

```
Phase 1: 需求拆解 → Phase 2: 代码开发 → Phase 3: 测试验证
                    ↑                    ↑
                    └────── 修复 ─────────┘
                                        ↓
                 Phase 6: 关闭 Issue ← Phase 5: 复测合并 ← Phase 4: 审核修复
```

每个阶段完成后向用户汇报进展，获得确认后进入下一阶段。
遇到无法自行解决的问题时，**暂停并请求人工协助**，不要猜测或卡死。

---

## Phase 1: 需求拆解与验收

**目标**：以产品视角理解需求，拆解为可测试的验收条件。

### 步骤

1. **读取 Issue**

   ```bash
   gh issue view <number>
   ```

   若用户给的是需求描述而非 Issue 编号，先创建 Issue：

   ```bash
   gh issue create --title "<标题>" --body "<描述>" --label "enhancement"
   ```

2. **拆解验收条件**
   从 Issue 描述中提取：
   - **功能需求**：要做什么
   - **非功能需求**：性能、兼容性等约束
   - **验收标准**（AC）：每条必须可测试、可验证

3. **向用户确认**
   展示拆解结果，格式：

   ```
   📋 需求拆解：#<number> <标题>

   ## 验收条件
   - [ ] AC1: ...
   - [ ] AC2: ...
   - [ ] AC3: ...

   请确认以上拆解是否准确，或补充修改。
   ```

4. **等待用户确认** 后进入 Phase 2

### 暂停条件

- Issue 描述模糊，无法拆解出明确的验收条件
- 需求涉及项目中不熟悉的领域

---

## Phase 2: 代码开发

**目标**：基于验收条件，用 TDD 方式完成功能开发。

### 步骤

1. **创建特征分支**

   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b <issueId>-<中文slug>
   ```

   分支命名示例：`7-支持代码块渲染`

2. **先写测试**（TDD）
   - 根据验收条件编写测试用例，放在 `tests/` 对应目录下
   - 测试文件命名：`<feature-name>.test.ts`
   - 确保测试**先失败**（红）

3. **实现功能**
   - 编写最小代码使测试通过（绿）
   - 重构代码保持质量（重构）
   - 遵循项目的 TypeScript 规范和已有代码风格

4. **提交代码**
   遵循提交信息规范：
   ```bash
   git add <具体文件>
   git commit -m "feat: <中文描述> (closes #<issueId>)"
   ```
   > `closes #<issueId>` 会在 PR 合并后自动关闭 Issue

### 暂停条件

- 实现方案有多种选择，需要用户决策
- 需要修改不熟悉的核心模块
- 遇到阻塞性的技术问题

---

## Phase 3: 测试验证

**目标**：确保所有测试通过，代码质量检查无误。

### 步骤

1. **运行完整检查**

   ```bash
   npm test              # 单元测试
   npm run check         # TypeScript 类型检查
   npm run lint:pii      # PII 扫描
   ```

2. **分析结果**
   - **全部通过** → 进入 Phase 4
   - **有失败** → 分析失败原因，回到 Phase 2 修复

3. **回到 Phase 2 的条件**
   - 测试断言失败：修改代码逻辑
   - 类型错误：修复类型定义
   - PII 告警：脱敏处理

### 循环规则

Phase 2 ↔ Phase 3 构成内循环，直到所有检查通过。
最多循环 **3 轮**，仍未解决则暂停请求人工协助。

---

## Phase 4: 审核与修复

**目标**：自审代码质量，评估风险，发现潜在问题。

### 步骤

1. **执行 Code Review**
   读取 `references/review-checklist.md`，逐项检查：
   - 代码质量：命名、结构、重复、错误处理
   - 架构合理性：是否符合项目分层、是否引入不当耦合
   - 测试覆盖：验收条件是否全部覆盖、边界情况
   - 安全性：PII 泄露、注入风险、依赖安全

2. **输出审核报告**

   ```
   🔍 Code Review 报告

   ## 发现的问题
   - [严重] ...
   - [建议] ...

   ## 风险评估
   - 低/中/高

   ## 结论
   - ✅ 无阻塞问题，可进入合并
   - ⚠️ 有 N 个问题需修复后重新提交
   ```

3. **处理审核结果**
   - **无问题** → 进入 Phase 5
   - **有问题** → 修复后回到 Phase 2，重新走 Phase 3

### 暂停条件

- 涉及架构级改动，需要人工决策
- 存在安全风险，需要人工确认
- 代码改动范围超出预期，需要重新评估需求

---

## Phase 5: 复测与合并

**目标**：最终验证，创建 PR 并合并到 dev 分支。

### 步骤

1. **最终测试**（确保 Phase 4 的修复没有引入新问题）

   ```bash
   npm test
   npm run check
   npm run lint:pii
   ```

2. **推送分支**

   ```bash
   git push origin <branch-name>
   ```

3. **创建 PR**

   ```bash
   gh pr create --base dev --title "feat: <描述> (#<issueId>)" --body "..."
   ```

   PR body 包含：
   - 关联的 Issue：`Closes #<issueId>`
   - 改动摘要
   - 测试结果

4. **合并 PR**

   ```bash
   gh pr merge --squash --delete-branch
   ```

5. **切换回 dev 并拉取最新**
   ```bash
   git checkout dev
   git pull origin dev
   ```

### 暂停条件

- CI 检查失败，需要排查
- PR 存在合并冲突，需要手动解决

---

## Phase 6: 关闭 Issue

**目标**：记录完成状态，干净退出。

### 步骤

1. **添加完成评论**

   ```bash
   gh issue comment <number> --body "✅ 已完成，PR #<pr-number> 已合并到 dev。"
   ```

2. **关闭 Issue**（如果 commit message 中没有 `closes` 关键字）

   ```bash
   gh issue close <number>
   ```

3. **输出总结**

   ```
   🎉 端到端完成！

   Issue:    #<number> <title>
   PR:       #<pr-number>
   分支:     <branch-name> (已删除)
   状态:     ✅ 已关闭

   改动文件：
   - src/...
   - tests/...
   ```

---

## 异常处理

### 测试持续失败

Phase 2 ↔ Phase 3 循环 3 轮后仍未通过：

```
⚠️ 测试在 3 轮修复后仍未通过，需要人工协助。

失败的测试：<test-name>
错误信息：<error-message>

请检查：
1. 验收条件是否理解有误？
2. 实现方案是否需要调整？
3. 测试用例本身是否有问题？
```

### 审核发现阻塞问题

Phase 4 发现严重问题但无法自行修复：

```
⚠️ Code Review 发现阻塞性问题，需要人工决策。

问题：<description>
影响范围：<scope>
建议方案：<suggestion>

请确认如何处理。
```

### 合并冲突

Phase 5 遇到合并冲突：

```
⚠️ 分支存在合并冲突，需要手动解决。

冲突文件：
- <file1>
- <file2>

建议：请先解决冲突后告诉我继续，或我尝试自动解决。
```

---

## 项目约定

本 skill 运行时自动遵循项目的 `CLAUDE.md` 中定义的规则：

- **分支策略**：`dev` 为开发主分支，特征分支 `{issueId}-{slug}`
- **提交规范**：`feat:` / `fix:` / `chore:` / `docs:` / `test:`
- **版本管理**：semantic-release 自动管理，禁止手动改版本号
- **PII 规则**：绝对路径、API Key、`.env` 追踪等均会被拦截
