---
name: belos-street
title: Belos Street Coding Conventions
description: Personal coding conventions and best practices
icon: 🏠
tags: [conventions, best-practices, coding-style]
---

# Belos Street Coding Conventions

个人编码习惯与最佳实践

## Naming Conventions

- 文件与目录命名 → See [naming-conventions](reference/naming-conventions.md)

## Code Organization

- 代码组织方式 → See [code-organization](reference/code-organization.md)

## Code Style

- 代码风格配置 → See [code-style](reference/code-style.md)

## Testing Philosophy

- 测试理念 → See [testing-philosophy](reference/testing-philosophy.md)

## LLM Coding Guidelines

- LLM 编码指南 → See [llm-coding-guidelines](reference/llm-coding-guidelines.md)

## Quick Reference

### 命名风格速查表

| 类型 | 风格 | 示例 |
|------|------|------|
| 文件/目录 | kebab-case | `user-profile.ts`, `api-helper/` |
| Vue/React 组件 | kebab-case | `user-profile.vue`, `product-card.tsx` |
| 函数/变量 | camelCase | `fetchUserData`, `isLoading` |
| 接口/类型 | PascalCase | `UserInfo`, `ApiResponse` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 布尔值 | is/has/can 前缀 | `isActive`, `hasPermission` |

### 核心原则

1. **一致性优先** - 在整个项目中保持命名风格一致
2. **描述性** - 命名要有意义，能表达意图
3. **简洁** - 在保证清晰的前提下尽量简短
4. **避免缩写** - 除非是广泛认可的缩写（如 `id`, `api`, `url`）
