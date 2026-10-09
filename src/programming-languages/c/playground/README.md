# 🏋️ C Playground — 配套练习册（408 备考向）

> 配合 `../doc/01`~`doc/03` 的 Rustlings 风格练习：**读一节文档，做对应练习**。
> 每个练习是独立的 `.c` 文件，交付时可编译、零警告；实现全部 TODO 后运行打印 🎉 即为完成。

## 目录结构

```text
playground/
├── Makefile                # 一条命令编译/运行/自检（见下）
├── common/check.h          # 自检工具宏（给定代码，不用深究，专注做题）
├── ch01-syntax/            # 第 1 章 基础语法 → doc/01-basic-syntax.md
├── ch02-pointers/          # 第 2 章 数组与指针 → doc/02-pointers-and-arrays.md
├── ch03-struct-memory/     # 第 3 章 结构体内存与 408 规范 → doc/03-struct-memory-408.md
├── solutions/              # 全部答案（可编译可运行，先做再看！）
└── qna.md                  # 学习 Q&A 沉淀（有问题先翻这里）
```

## 练习 ↔ 文档对照

### 第 1 章 ch01-syntax（5 个）

| 练习 | 对应文档 | 核心考点 |
|------|---------|---------|
| `ex01-hello-types` | §1.2 + §1.3 | 工具链跑通、char 是 1 字节整数、类型宽度表 |
| `ex02-int-division` | §1.5 + doc 练习 | 整除截断、余数符号、判奇数的负数坑 |
| `ex03-switch-static` | §1.6 + §1.7 + doc 练习 3 | fall-through、static 局部变量 |
| `ex04-sum` | §1.7 + doc 练习 1 | for + 累加器、边界 n=0/1、O(n) vs O(1) |
| `ex05-recursion` | §1.8 + doc 练习 2 | 递归两要素、fib 调用次数 15、O(2^n) |

### 第 2 章 ch02-pointers（6 个）

| 练习 | 对应文档 | 核心考点 |
|------|---------|---------|
| `ex01-pointer-basics` | §2.3 | & / *、指针重定向、NULL 判空 |
| `ex02-swap` | §2.5 + §1.7 | 传值 vs 指针传参、指针带回多值 |
| `ex03-array-param` | §2.1 + §2.2 | 签名必带 n、部分初始化补 0、行优先地址公式 |
| `ex04-pointer-arithmetic` | §2.4 + doc 练习 1 | a[i]⟺*(a+i)、双指针找最大、原地逆置 |
| `ex05-my-strlen` | §2.7 + doc 练习 2/3 | 手写 strlen、逐字符遍历、字面量只读陷阱 |
| `ex06-double-pointer` | §2.6 | 二级指针逐层开箱、严蔚敏 &L 的真实身份 |

### 第 3 章 ch03-struct-memory（6 个）

| 练习 | 对应文档 | 核心考点 |
|------|---------|---------|
| `ex01-struct-basics` | §3.1 | . vs ->、自引用成链、while 遍历 |
| `ex02-typedef-408` | §3.2 + doc 练习 1 | 408 标准定义改写、LNode/LinkList/DNode |
| `ex03-malloc-free` | §3.3 + §3.4 | malloc 三件套、SqList 定义与初始化 |
| `ex04-tail-insert` | §3.6 + doc 练习 2 | 尾插法默写（L/s/r 三角色） |
| `ex05-reverse-list` | §3.5 | 头插法逆置三步（暂存→头插→后移） |
| `ex06-delete-x` | doc 练习 3（2019 真题） | 前驱指针删结点 + 三问格式笔答 |

## 使用方法

```bash
cd playground

# 做某个练习（首次从 ex01 开始）
make run EX=ex01-hello-types
make run EX=ex02-swap

# 检查全部练习能否编译（交付态零警告）
make

# 运行全部答案自检（做完练习后对照；全绿 = 练习可解）
make solutions

# 不用 make 也行：单文件直接编译
clang ch01-syntax/ex01-hello-types.c -o /tmp/ex01 && /tmp/ex01
```

**练习约定**：

- `// TODO:` 标记的地方需要你实现；占位值（`return 0;`、`NULL`）会让 CHECK 变 ❌，实现后重跑直到打印 🎉
- `🧪 实验` = 故意埋的问题代码（已注释），取消注释观察编译警告 / 运行崩溃 / 逻辑错误，**看完恢复注释**
- 函数签名和类型标注是脚手架，照着骨架填逻辑即可，不要改签名
- 卡住超过 15 分钟 → 看 `solutions/` 同名答案（含关键点注释），再回头重做

## 作答工作流（重要）

**不要在 `playground/` 里答题**——它是 git 管理的 pristine 题库。在旁边建一个答题副本 `playground-work/`，随便写随便改：

```bash
# 一次性：创建答题副本（已建好可跳过）
cd src/programming-languages/c
rsync -a --exclude 'build/' playground/ playground-work/
```

| 目录 | 角色 | git |
|------|------|-----|
| `playground/` | pristine 题库，保持未作答状态 | ✅ 入库 |
| `playground-work/` | 你的答题副本，直接在练习文件上写答案 | ❌ 已忽略 |

**复原练习**（写乱了 / 想重做，从题库覆盖回来）：

```bash
cd src/programming-languages/c

# 复原全部章节
rsync -a --delete --exclude 'build/' playground/ playground-work/

# 只复原某一章
rsync -a --delete --exclude 'build/' playground/ch02-pointers/ playground-work/ch02-pointers/
```

⚠️ 副本不入库：换设备后重新执行创建命令即可。若误改了题库本体，`git restore src/programming-languages/c/playground` 可恢复。

## 常用命令

| 命令 | 用途 |
|------|------|
| `make run EX=<练习名>` | 编译并运行单个练习（自动在各章查找） |
| `make` | 检查全部练习能否编译（不碰 solutions） |
| `make solutions` | 一键跑全部答案自检（全绿 = 练习可解） |
| `make clean` | 清理 `build/` 编译产物 |
| `clang --version` | 工具链版本（macOS 自带 clang 即可） |

> 💡 `solutions/` 不进默认构建——"先做再看"靠机制不靠自觉；看答案直接读文件或 `make solutions` 自检。

## 后续扩展

- 完成本练习册后进入 [数据结构模块](../../../computer-science/data-structures/data-structures-learning-outline.md) 第 2 章"线性表"——那里的代码风格与本练习册保持一致（typedef + 结构体指针 + malloc）
- 需要更多手感时，可按同样模式自加专题目录（如 `ch04-drills/`：顺序表/栈/队列的基础操作模板）
