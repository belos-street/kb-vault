# 计算机科学

> 面向**全栈/后端开发者**的计算机科学理论笔记。与 `deploy/` 的实操性内容互补，这里侧重原理、概念和面试高频知识点。

---

## 目录说明

| 目录 | 涵盖内容 | 对开发者的价值 |
|------|---------|---------------|
| **algorithms/** | 排序/搜索、树/图、动态规划、并查集、字符串匹配、复杂度分析 | 编程基本功、面试核心、系统设计基石 |
| **data-structures/** | 线性表、树、图、哈希、堆、跳表等数据结构原理与实现 | 算法基础、选型依据、性能分析 |
| **computer-organization/** | 数据表示（IEEE 754）、存储层次（Cache）、指令流水线、CPU 数据通路、总线、I/O 接口 | 理解硬件如何执行软件，性能优化的底层依据 |
| **operating-system/** | 进程与线程（调度/同步）、内存管理（虚拟内存/分页）、I/O 模型、死锁 | 理解程序执行的底层机制，与 deploy/linux 互补 |
| **networking/** | TCP/IP 协议栈、拥塞控制、HTTP/1.1→2→3 演进、Socket、WebSocket | 与 deploy/network 互补：这里是协议原理，那里是排障实操 |
| **design-patterns/** | GoF 23 种经典模式 + 现代工程模式（DI/CQRS/Event Sourcing），TS 实现 | 代码可维护性、架构基础、面试高频 |
| **compiler/** | 词法分析、语法分析、AST、IR、代码生成 | 理解 Babel/ESLint/Vite/TypeScript 工具链的工作原理 |
| **program-analysis/** | 数据流分析、抽象解释、类型系统、污点分析 | 静态分析工具开发、ESLint 规则、安全扫描 |
| **software-engineering/** | 设计模式、架构设计、DDD、测试工程、CI/CD、重构、分布式模式 | Tech Lead 成长路径、架构决策、工程治理 |
| **graphics/** | 渲染管线、光栅化、着色器、光照模型、光线追踪、WebGPU | WebGL/WebGPU 开发、可视化底层、3D 编辑器 |

---

## 408 考研覆盖

本目录下的 `data-structures/`、`computer-organization/`、`operating-system/`、`networking/` 四个模块完整覆盖 408 计算机学科专业基础的四门科目：

| 408 科目 | 对应目录 | 分值 |
|---------|---------|------|
| 数据结构 | data-structures/ | ~45 分 |
| 计算机组成原理 | computer-organization/ | ~45 分 |
| 操作系统 | operating-system/ | ~35 分 |
| 计算机网络 | networking/ | ~25 分 |

---

## 与 deploy/ 的互补关系

| 计算机科学（理论） | deploy/（实操） |
|-------------------|----------------|
| 计组原理（Cache、流水线、中断/DMA） | [linux/](../deploy/linux/) 系统性能观察 |
| OS 原理（进程调度、虚拟内存） | [linux/](../deploy/linux/) 命令与系统管理 |
| 网络协议（TCP 拥塞控制、HTTP 演进） | [network/](../deploy/network/) DNS/HTTP/HTTPS 排障 |
| 软件工程（架构设计、CI/CD） | [deploy/](../deploy/) 部署运维实践 |

## 学习建议

1. **不要一次性啃完**。按需学习效果最好——写 SQL 遇到慢查询再看索引原理，遇到死锁再看事务隔离级别
2. **algorithms/** 推荐按面试专题刷，配合 LeetCode 练习
3. **compiler/** 偏向理解工具链，不需要精通实现，但理解 AST 对前端调试和 Plugin 开发很有帮助
