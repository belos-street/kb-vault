---
name: interface-design
title: Go 接口设计
description: 设计小而解耦的接口：隐式实现、接口组合、面向接口编程、类型断言、nil 陷阱。当用户要设计/review Go 接口与解耦时使用。
tags: [go, interface, design]
---

# Go 接口设计

一句话定位：用"隐式实现 + 小接口组合"达成依赖倒置 —— 让代码依赖抽象，不依赖具体实现，天然可测试、易替换。

## 什么时候用
- 想在函数/结构体里接"能做什么"的能力，而非具体类型。
- 需要替换后端实现（文件/网络/缓冲区/测试替身）却不改调用方。
- 想拆分/组合能力到接口。
- 处理 `any` 类型时需要安全地还原具体类型。

## 怎么做（核心步骤）

### 1. 定义小接口（1-3 个方法）
```go
type Writer interface { Write(p []byte) (n int, err error) }
type Reader interface { Read(p []byte) (n int, err error) }
```

### 2. 面向接口编程（依赖抽象，依赖注入）
```go
// ❌ 绑死具体实现
func SaveToFile(data []byte, path string) error { return os.WriteFile(path, data, 0644) }

// ✅ 依赖接口，调用方任选实现
func SaveData(data []byte, w Writer) error { _, err := w.Write(data); return err }
// SaveData(data, os.Stdout) / SaveData(data, bytes.Buffer) / SaveData(data, socket)
```
这样测试可传 `bytes.Buffer`，不写真实文件；换后端不改调用代码。

### 3. 接口组合（无继承，靠嵌入）
```go
type ReadWriter interface { Reader; Writer } // 组合成更大接口
// 标准库 io.ReadWriter / io.ReadCloser 同理
```

### 4. `any` 与类型断言
```go
var v any = 42
s, ok := v.(string)      // 安全断言：comma-ok
switch v := v.(type) {   // type switch 按类型分支
case int: ...
case string: ...
}
```

## 常见坑 ⚠️
| 错误做法 ❌ | 后果 | 正确做法 ✅ |
|------------|------|------------|
| 为"生产者"预先造大接口 | 接口庞大、耦合高、约束没人实现 | 接口在**消费端按需声明**（Go 约定：接口由使用者定义） |
| 直接 `v.(string)` 不判 ok | 类型不符即 panic | 一律 `v, ok := v.(string)` |
| 忽略接口 nil 陷阱 | 误判 nil，产生诡异 bug | 牢记：`(*Dog)(nil)` 赋给 interface 后，interface ≠ nil |
| 面向具体类型编程 | 替换/测试都要改调用方 | 依赖接口 |

> **nil 陷阱**：interface 是 `(type, value)` 二元组，两个都为 nil 才是 nil。一个 typed-nil（如 `*Dog(nil)`）装进 interface，`iface != nil` 成立但调用方法会 panic。

## 决策点
| 场景 | 推荐 | 理由 |
|------|------|------|
| 只描述行为契约 | 空接口以外的最小方法集合 | 接口最小化 |
| 需要读写同时具备 | 组合 `Reader; Writer` | 复用语义 |
| 解耦替换实现 | 消费端定义接口 + 注入 | 依赖倒置，可测 |
| 参数类型不确定 | `any` + type switch | 类型安全分支 |

## 参考：官方文档（核验用）🔗
| 关键点 | 官方文档 |
|--------|----------|
| 接口由消费者定义（Go 惯例） | [Effective Go: Interfaces](https://go.dev/doc/effective_go#interfaces) |
| 组合复用机制 | [Go 文档：Embedding](https://go.dev/doc/effective_go#embedding) |

## 一句话结论
- 小接口、消费端自定义、面向接口编程 + 组合；处理 `any` 用 comma-ok 断言；警惕 typed-nil 让 interface 不等于 nil。