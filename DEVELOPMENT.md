# 开发流程规范

## E2E 循环

每个 Issue 严格按以下流程执行：

```
1. PM 设计
   ├── 明确用户故事
   ├── 定义验收标准
   └── 输出设计文档

2. 创建分支
   └── git checkout -b feature/{issue}-{name} dev

3. 开发
   ├── 编写代码
   ├── 编写测试
   └── 确保测试通过

4. 测试
   ├── npm run test
   ├── npm run lint
   └── npm run build

5. 代码审核
   ├── 自审代码
   ├── 检查边界情况
   └── 确认与原仓库行为一致

6. 修改
   └── 根据审核意见修改

7. 合码
   └── PR 合并到 dev

8. 推送
   └── git push origin dev

9. 关 Issue
   └── gh issue close {number}

10. 干净退出
    └── git branch -d feature/{issue}-{name}
```

## 验收标准模板

每个 Issue 必须包含：

```markdown
## 用户故事

作为 [角色]，我需要 [功能]，以便 [价值]

## 验收标准

- [ ] 标准 1
- [ ] 标准 2
- [ ] 标准 3

## 测试用例

1. 测试场景 1 → 预期结果
2. 测试场景 2 → 预期结果
```

## 代码审核清单

- [ ] 代码风格符合 ESLint 规则
- [ ] 有对应的单元测试
- [ ] 测试种子在 fixtures 目录
- [ ] 没有硬编码的 API Key
- [ ] 错误处理完整
- [ ] 日志输出清晰
- [ ] 与原仓库行为一致
