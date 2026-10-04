# 🏋️ Rust Playground — 配套练习册

> 配合 `../doc/01`~`doc/05` 的 Rustlings 风格练习：**读一节文档，做对应练习**。
> 每个练习是一个独立的 cargo bin，练习交付时可编译；实现所有 `todo!()` 后运行通过即为完成。

## 目录结构

```text
playground/
├── ch01-syntax/            # 第 1 章 基础语法 → doc/01-basic-syntax.md
├── ch02-ownership/         # 第 2 章 所有权借用 → doc/02-ownership-borrowing.md
├── ch03-composite-types/   # 第 3 章 组合类型 → doc/03-composite-types.md
├── ch04-traits-generics/   # 第 4 章 Trait 与泛型 → doc/04-traits-generics.md
├── ch05-practical-skills/  # 第 5 章 实战能力 → doc/05-practical-skills.md
└── solutions/              # 全部答案（可编译可运行，先做再看！）
```

## 练习 ↔ 文档对照

### 第 1 章 ch01-syntax（5 个）

| 练习 | 对应文档 | 核心考点 |
|------|---------|---------|
| `ex01-variables-shadowing` | §1.3 变量与绑定 | mut / shadowing / const |
| `ex02-types-tuples` | §1.4 基本数据类型 | 标量、char、元组解构、as |
| `ex03-expressions-functions` | §1.4 + §1.5 | 一切皆表达式、无 return |
| `ex04-control-flow` | §1.6 + doc 练习 2 | Range、loop 带值、FizzBuzz |
| `ex05-implicit-conversion` | §1.4 + doc 练习 3 | 无隐式转换、截断语义 |

### 第 2 章 ch02-ownership（6 个）

| 练习 | 对应文档 | 核心考点 |
|------|---------|---------|
| `ex01-move-semantics` | §2.1 + doc 练习 1 | move 语义、E0382 |
| `ex02-clone-copy` | §2.2 | Move / Clone / Copy 三分法 |
| `ex03-borrowing` | §2.3 | & / &mut 借用传参 |
| `ex04-borrow-rules-nll` | §2.4 + doc 练习 2 | 借用规则、NLL、E0502 |
| `ex05-dangling` | §2.5 + doc 练习 3 | 悬垂引用、所有权转移 |
| `ex06-lifetimes` | §2.6 | 'a 标注、省略规则、E0597 |

### 第 3 章 ch03-composite-types（5 个）

| 练习 | 对应文档 | 核心考点 |
|------|---------|---------|
| `ex01-struct-basics` | §3.1 | 实例化、`..` 更新语法的所有权陷阱 |
| `ex02-methods-impl` | §3.2 | &self / &mut self / 关联函数 |
| `ex03-enum-with-data` | §3.3 + doc 练习 1 | 带数据的 enum、impl 方法 |
| `ex04-option-result` | §3.4 + doc 练习 2 | Option 替代 null、if let |
| `ex05-match-deep` | §3.5 + doc 练习 3 | match 守卫、解构、@ 绑定 |

### 第 4 章 ch04-traits-generics（5 个）

| 练习 | 对应文档 | 核心考点 |
|------|---------|---------|
| `ex01-generics` | §4.1 + doc 练习 2 | 泛型函数/结构体、PartialOrd |
| `ex02-trait-basics` | §4.2 + doc 练习 1 | 定义/实现 trait、默认实现、孤儿规则 |
| `ex03-trait-bounds` | §4.3 | &impl Trait、where、-> impl Trait |
| `ex04-from-into` | §4.4 + doc 练习 3 | 实现 From 白嫖 Into |
| `ex05-derive-display` | §4.4 | derive 宏、手动 Display |

### 第 5 章 ch05-practical-skills（6 个）

| 练习 | 对应文档 | 核心考点 |
|------|---------|---------|
| `ex01-vec` | §5.2 Vec | 增删查改、get vs 索引 |
| `ex02-hashmap` | §5.2 HashMap | entry().or_insert() 计数、生命周期回访 |
| `ex03-iterators-closures` | §5.3 + doc 练习 2 | 惰性链、闭包三种捕获、move |
| `ex04-error-handling` | §5.1 | match vs ?、unwrap_or |
| `ex05-custom-error` | §5.1 | 错误 enum + Display + From + ? |
| `ex06-file-io` | §5.4 + doc 练习 1 | 文件读写、Box<dyn Error> |

## 使用方法

```bash
cd playground

# 做某个练习（首次从 ex01 开始）
cargo run -p ch01-syntax --bin ex01-variables-shadowing
cargo run -p ch02-ownership --bin ex01-move-semantics

# 运行全部答案自检（做完练习后对照）
cargo run -p solutions --bin ch02-ex01-move-semantics

# 列出某章所有练习
ls ch05-practical-skills/src/bin/
```

**练习约定**：

- `todo!()` = 待实现，运行会 panic，实现后重跑直到全部打印 ✅
- `🧪 实验` = 故意错误的代码（已注释），取消注释观察编译错误、读懂信息后修复
- 绑定处给出的类型标注（如 `let x: i32 = todo!()`）是脚手架，替换 `todo!()` 即可
- 卡住超过 15 分钟 → 看 `solutions/` 同名答案（含修复思路注释），再回头重做

## 作答工作流（重要）

**不要在 `playground/` 里答题**——它是 git 管理的 pristine 题库。在旁边建一个答题副本 `playground-work/`，随便写随便改：

```bash
# 一次性：创建答题副本（已建好可跳过）
cd src/programming-languages/rust
rsync -a --exclude 'target/' playground/ playground-work/
```

| 目录 | 角色 | git |
|------|------|-----|
| `playground/` | pristine 题库，保持未作答状态 | ✅ 入库 |
| `playground-work/` | 你的答题副本，直接在练习文件上写答案 | ❌ 已忽略 |

**复原 ch01~05**（写乱了 / 想重做，从题库覆盖回来）：

```bash
cd src/programming-languages/rust

# 复原全部章节
rsync -a --delete --exclude 'target/' playground/ playground-work/

# 只复原某一章
rsync -a --delete --exclude 'target/' playground/ch02-ownership/ playground-work/ch02-ownership/
```

`--exclude 'target/'` 不碰编译缓存，`--delete` 会清掉练习目录里多写出来的文件。

⚠️ 副本不入库：换设备后重新执行创建命令即可；想保留答案轨迹，定期备份 `playground-work/`。若误改了题库本体，`git restore src/programming-languages/rust/playground` 可恢复。

## 常用命令

| 命令 | 用途 |
|------|------|
| `cargo run -p <crate> --bin <name>` | 运行单个练习 |
| `cargo build --workspace` | 检查全部代码能否编译 |
| `cargo check -p ch02-ownership` | 快速检查某章（不生成二进制） |
| `for b in solutions/src/bin/*.rs; do cargo run -q -p solutions --bin $(basename $b .rs); done` | 一键跑全部答案自检（全绿 = 练习可解） |
| `rustc --version` | 工具链版本（需要 1.85+，edition 2024） |

> 💡 `default-members` 已把 `solutions` 排除在默认构建/补全之外——练习时 tab 补全看不到答案文件名；看答案需显式 `-p solutions`。

## 后续扩展

- 综合实战：doc/05.5 的 CLI TODO 项目（clap + serde，独立 crate，练习 5.5 的扩展需求）
- 第 6 章精进主题（并发/异步/宏）：需要时按同样模式添加 `ch06-advanced`
