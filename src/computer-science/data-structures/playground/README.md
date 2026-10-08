# 🏋️ 数据结构 Playground — 408 配套练习册（C 语言）

> 配合 `../doc/01`~`doc/08` 的 Rustlings 风格练习：**读一节文档，做对应练习**。
> 每个练习是独立的 `.c` 文件，交付时可编译、零警告；实现全部 TODO 后运行打印 🎉 即为完成。
> 练习数量与难度按大纲「各篇规格声明」的重要度分配——05 树 / 06 图 / 08 排序为重点章。

## 目录结构

```text
playground/
├── Makefile                # 一条命令编译/运行/自检（见下）
├── common/check.h          # 自检工具宏（给定代码，不用深究）
├── ch01-intro/             # 第 1 章 绪论（复杂度分析）
├── ch02-linear-list/       # 第 2 章 线性表（算法题主战场）
├── ch03-stack-queue/       # 第 3 章 栈和队列
├── ch04-string/            # 第 4 章 串（KMP）
├── ch05-tree/              # 第 5 章 树与二叉树
├── ch06-graph/             # 第 6 章 图
├── ch07-search/            # 第 7 章 查找
├── ch08-sorting/           # 第 8 章 排序
└── solutions/              # 全部答案（可编译可运行，先做再看！）
```

## 练习 ↔ 文档对照（26 个）

### 第 1 章 ch01-intro（1 个）

| 练习 | 对应文档 | 核心考点 |
|------|---------|---------|
| `ex01-complexity-lab` | §1.3 + §1.4 | 循环计数精确值 vs 大 O 阶；递归次数/深度；汉诺塔 O(2^n)（💡 拓展考点：文档未覆盖，递推式 T(n)=2T(n-1)+1） |

### 第 2 章 ch02-linear-list（4 个）

| 练习 | 对应文档 | 核心考点 |
|------|---------|---------|
| `ex01-sq-list-ops` | §2.2 | ListInsert/ListDelete 移动方向、length 更新、越界与表满 |
| `ex02-link-ops` | §2.3 | 按位查找/插入/删除——全部先找前驱、先接后继防断链 |
| `ex03-reverse-merge` | §2.8.1 + 2.8.2 | 头插法原地逆置；归并合并有序链表（真题高频） |
| `ex04-two-pointer` | §2.8.3~2.8.5 | 删 x（pre 前驱法）、删倒数第 k 个、找中点（快慢指针） |

### 第 3 章 ch03-stack-queue（3 个）

| 练习 | 对应文档 | 核心考点 |
|------|---------|---------|
| `ex01-sq-stack` | §3.2 + §3.3 | 栈满 `top==MaxSize-1`、栈空 `top==-1`；共享栈判满 |
| `ex02-circular-queue` | §3.6 | 牺牲单元法判满判空；长度公式 `+MaxSize 再取模` |
| `ex03-bracket-postfix` | §3.9 | 括号就近匹配；后缀求值"先弹为右操作数" |

### 第 4 章 ch04-string（2 个）

| 练习 | 对应文档 | 核心考点 |
|------|---------|---------|
| `ex01-bf-match` | §4.3 | BF 回溯 `i=i-j+2`；最坏 (n-m+1)×m = 28 次实测 |
| `ex02-kmp` | §4.4 + §4.5 | get_next / get_nextval 默写；KMP 主串不回溯 |

### 第 5 章 ch05-tree（4 个）

| 练习 | 对应文档 | 核心考点 |
|------|---------|---------|
| `ex01-traversal` | §5.4 | 递归三序（只差 visit 位置）+ 队列层序 |
| `ex02-nonrec-construct` | §5.4.3 + 5.4.6 | 栈版中序非递归；先序+中序唯一构造二叉树 |
| `ex03-huffman` | §5.7 | 教材静态数组法构造；WPL 双法验算（205 / 36） |
| `ex04-union-find` | §5.8 | 路径压缩 + 按规模合并；连通分量计数 |

### 第 6 章 ch06-graph（4 个）

| 练习 | 对应文档 | 核心考点 |
|------|---------|---------|
| `ex01-bfs-dfs` | §6.3 | 邻接表 BFS/DFS 序列（头插法陷阱）；全图遍历外层循环 |
| `ex02-mst` | §6.4 | Prim（lowcost 更新）+ Kruskal（并查集判环），MST=15 |
| `ex03-shortest-path` | §6.5 | Dijkstra 贪心松弛；Floyd 的 k 必须最外层 |
| `ex04-topo-sort` | §6.6 | 队列版拓扑排序；输出数 < n 判环 |

### 第 7 章 ch07-search（4 个）

| 练习 | 对应文档 | 核心考点 |
|------|---------|---------|
| `ex01-binary-search` | §7.2 | 折半查找 + 比较次数 = 判定树层数 |
| `ex02-bst-ops` | §7.3.1 | BST 插入/查找/删除三情形；中序递增验证 |
| `ex03-avl-rotate` | §7.3.2 | 失衡类型判断 + 四种旋转（旋转函数给定） |
| `ex04-hash-asl` | §7.4 | 线性探测构造；成功/失败 ASL 程序化计算 |

### 第 8 章 ch08-sorting（4 个）

| 练习 | 对应文档 | 核心考点 |
|------|---------|---------|
| `ex01-insert-bubble` | §8.2 + §8.3.1 | 哨兵插入；flag 冒泡；最好情况 n-1 次比较实测 |
| `ex02-quick-partition` | §8.3.2 + §8.9 | 一趟划分推演（§8.10 例 1）+ 荷兰国旗（2016 真题） |
| `ex03-heap-select` | §8.4 | 建堆推演逐位验证；简单选择比较恒 n(n-1)/2 |
| `ex04-merge-shell` | §8.5 + §8.2.3 | 归并 `<=` 保稳定；希尔按趟手推验证 |

## 使用方法

```bash
cd playground

# 做某个练习（建议按章推进：02 → 05 → 06 → 08 是重点）
make run EX=ex01-sq-list-ops
make run EX=ex03-huffman

# 检查全部练习能否编译（交付态零警告）
make

# 运行全部答案自检（做完练习后对照；全绿 = 练习可解）
make solutions
```

**练习约定**：

- `// TODO:` 标记处需要你实现；占位值会让 CHECK 变 ❌，实现后重跑直到 🎉
- 结构体定义、建表/建图、结果比对等辅助代码全部**给定**——你只写核心算法，与 408 考场"只写算法函数"的场景一致
- 每个文件的 CHECK 大量复用**文档例题的推演结果**（如 MST=15、WPL=205、next=(0,1,1,2,2,3,1,2)、一趟划分 {40,38,46,56,79,84}），做题前先手推文档例题再写代码
- 卡住超过 15 分钟 → 看 `solutions/` 同名答案，再回头重做

## 代码约定（重要）

- **纯 C 写法**：408 考试 C/C++ 均可、教材常用 C++ 引用（`LinkList &L`），本练习册统一用纯 C 等价形式——返回值带回头指针、二级指针修改指针本身（对照 C 语言教程 §2.6 的两种写法表）
- **1 起点数组**（第 8 章）：`A[0]` 作哨兵/暂存位，与教材代码一致；注意 `A[0]` 会被排序函数改写
- **关键字简化为 int**：考试记录可能是 struct（`A[i].key`），算法逻辑完全一致

## 作答工作流（重要）

**不要在 `playground/` 里答题**——它是 git 管理的 pristine 题库。在旁边建一个答题副本 `playground-work/`：

```bash
# 一次性：创建答题副本（已建好可跳过）
cd src/computer-science/data-structures
rsync -a --exclude 'build/' playground/ playground-work/
```

| 目录 | 角色 | git |
|------|------|-----|
| `playground/` | pristine 题库，保持未作答状态 | ✅ 入库 |
| `playground-work/` | 你的答题副本，直接在练习文件上写答案 | ❌ 已忽略 |

**复原练习**（写乱了 / 想重做）：

```bash
cd src/computer-science/data-structures

# 复原全部章节
rsync -a --delete --exclude 'build/' playground/ playground-work/

# 只复原某一章
rsync -a --delete --exclude 'build/' playground/ch06-graph/ playground-work/ch06-graph/
```

⚠️ 副本不入库：换设备后重新执行创建命令即可。若误改了题库本体，`git restore src/computer-science/data-structures/playground` 可恢复。

## 常用命令

| 命令 | 用途 |
|------|------|
| `make run EX=<练习名>` | 编译并运行单个练习（自动在各章查找） |
| `make` | 检查全部练习能否编译（不碰 solutions） |
| `make solutions` | 一键跑全部答案自检（全绿 = 练习可解） |
| `make clean` | 清理 `build/` 编译产物 |
| `clang --version` | 工具链版本（macOS 自带 clang 即可） |

## 后续扩展

- 串的 KMP 手算、B 树分裂合并、关键路径 ve/vl 等属于**手算推演**考点，请直接练习文档各章的"典型例题 + 自测题"
- 需要更多手感时可自加专题目录（如 `ch09-drills/`：双向链表、循环队列 tag 版、BF vs KMP 比较次数对比）
