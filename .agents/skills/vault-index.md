# vault-index

## 触发条件
用户要求 "生成索引"、"列出所有笔记"、"总结知识库"、"知识库概览"。

## 技能描述
遍历全部 7 个分类目录，统计每个分类下的笔记数量、文件列表，生成结构化的知识库索引视图。

## 执行流程

1. 按 `01`~`07` 顺序遍历各分类目录
2. 对每个 `.md` 文件提取一级标题（`# xxx`）作为笔记标题
3. 汇总生成索引视图

## 输出格式

```markdown
## 知识库索引

### 01-Programming-Languages (N 篇)
- [Go 并发模型](01-Programming-Languages/go-concurrency.md)
- ...

### 02-Frameworks-Middleware (M 篇)
- [Spring IoC 源码分析](02-Frameworks-Middleware/spring-ioc-source-analysis.md)
- ...
```

## 扩展策略
- 可定期运行，将结果写入根目录 `INDEX.md`
- 检查孤立的 `assets/` 图片（无笔记引用）并报告
