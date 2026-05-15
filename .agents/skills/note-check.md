# note-check

## 触发条件
用户要求 "检查笔记完整性"、"找死链"、"检查图片引用"、"review 笔记质量"。

## 技能描述
对知识库中的笔记进行质量检查，包括：
1. **死链检测** — 检查 `[[wikilink]]` 和 `[text](path)` 链接目标是否存在
2. **图片引用检查** — 检查 `![[image]]` 引用的图片是否存在
3. **空笔记检测** — 列出内容少于 50 字符的笔记
4. **无标题笔记** — 列出缺少一级标题的笔记

## 执行流程

1. 遍历所有分类目录下的 `.md` 文件
2. 对每个文件解析：
   - `[[link]]` 和 `[[link|alias]]` 内链
   - `![[]]` 图片嵌入
   - `[text](path)` 标准 Markdown 链接
3. 逐条验证链接目标是否存在（同仓库内）
4. 生成检查报告

## 输出格式

```markdown
## 笔记健康检查报告

### ❌ 死链 (N)
- `01-Programming-Languages/go-concurrency.md` → `[[不存在的笔记]]`

### ❌ 缺失图片 (M)
- `02-Frameworks-Middleware/spring-ioc.md` → `![[missing-diagram.png]]`

### ⚠️ 内容过短 (K)
- `07-Tips-Pitfalls/quick-note.md` (32 字符)

### ✅ 通过检查
- 共 X 篇笔记通过全部检查
```
