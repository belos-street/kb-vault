---
name: "go-skills"
title: "Go 项目最佳实战 Skill 集合"
description: "Go 语言项目落地时可直接执行的最佳实践：项目结构、错误处理、并发、接口设计、HTTP 服务、测试。当用户要写/改/review Go 工程代码时使用。"
tags: [go, backend, best-practices, "project"]
---

# Go 项目最佳实战 Skill 集合

自包含的实战手册，可独立搬运到任意项目使用，讲如何在**真实的 Go 工程**里直接照做，而不是讲解语法。

## 使用场景 → 读哪个能力

| 你要做什么 | 读 |
|-----------|----|
| 初始化项目 / 定目录结构 / 管依赖 / 定包可见性 | [reference/project-layout.md](reference/project-layout.md) |
| 设计错误处理：哨兵错误、包装、errors.Is/As、panic 纪律 | [reference/error-handling.md](reference/error-handling.md) |
| 写并发：goroutine/channel/select/worker pool，防数据竞争 | [reference/concurrency.md](reference/concurrency.md) |
| 设计解耦的接口：小接口、组合、面向接口编程、nil 陷阱 | [reference/interface-design.md](reference/interface-design.md) |
| 写 HTTP 服务/中间件/JSON/Context/优雅关闭 | [reference/http-service.md](reference/http-service.md) |
| 写测试：表格驱动、httptest、基准、race、coverage | [reference/testing.md](reference/testing.md) |

## 核心原则（一页速记）

1. **组合优于继承**：Go 没有继承。用 struct 嵌入 + 接口组合表达复用。
2. **错误就是值**：不抛异常。返回值带上 `error`，每步显式处理，用 `%w` 保链。
3. **通过通信共享内存**：用 channel 而非共享变量 + 锁；共享变量必须用互斥锁。
4. **小接口（1-3 个方法）**：接口是消费者的描述，不是生产者的清单。
5. **Context 永远第一参数**：阻塞调用都接受 ctx；不存进 struct，不传 nil。
6. **标准库优先**：HTTP/JSON/测试 90% 场景标准库够用，别急着引框架。
7. **业务与 IO 分离**：核心逻辑纯函数可测试；入口只做参数解析与展示。