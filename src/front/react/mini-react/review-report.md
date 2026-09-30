# 📊 mini-react 前五篇文档质量 Review（01~05）

> 审查基线：本目录 [readme.md](./readme.md) 规格声明（架构类 · 13 篇 · 01~11 精讲）+ [agents.md](../../../../agents.md) 项目规范
> 审查方法：doc-quality-reviewer 六维模型 · 静态验证（React main 源码逐条核对）· 动态验证（happy-dom Tier 2 实跑闭环）
> 审查日期：2026-09-28

---

**总评：7.5/10** —— 教学设计、源码对照的准确度是仓库顶级水准（篇 05 四处源码断言全部实证命中，文档代码与 `src/` 逐字零漂移），但 Tier 2 实跑发现 **3 个 P0 运行时 bug + 1 个 P1 边界 bug**，全部集中在「手写渲染器」这条核心交付线上：多层嵌套首挂载结构错乱、宿主 props 更新静默失效、连续插入崩溃、无 key 列表节点泄漏。四处均为局部几行修复，修完即可回到 9.5 水准。

---

## 一、大纲修订回执（上轮 review 的 7 项）

| 上轮发现                       | 落实情况                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------- |
| [P0] `shouldYieldForPaint`     | ✅ 已改 `shouldYieldToHost`，并补了导出名与 workLoop 包装关系（readme L179） |
| [P1] 最小学习路径缺 commit     | ✅ 改为 01→03→04→05→06（L82-83），与完成标准一致                             |
| [P1] `../../../agents.md` 死链 | ✅ readme 与 doc/ 内均改为正确层级（doc/ 用 5 级，已验证可达）               |
| [P2] v3/v4 里程碑不一致        | ✅ L95 与 L296-299 对齐                                                      |
| [P2] Context 措辞              | ✅ 改为 propagateContextChange 表述（L164/L168）                             |
| [P2] 层级归属说明              | ✅ L80 增加裁剪说明                                                          |
| [P2] doc 文件名映射            | ✅ L263-275 列出 13 篇文件名，与实际文件一致                                 |

---

## 二、格式规范度矩阵

| 规范要求                              | 01  | 02  | 03  | 04  | 05  |
| ------------------------------------- | :-: | :-: | :-: | :-: | :-: |
| 文件命名 `XX-模块名.md`               | ✅  | ✅  | ✅  | ✅  | ✅  |
| 头部元信息（篇目/时间/面试可答/前置） | ✅  | ✅  | ✅  | ✅  | ✅  |
| 代码示例分级合规                      | ✅  | ✅  | ✅  | ✅  | ✅  |
| 练习三段式（精讲档）                  | ✅  | ✅  | ✅  | ✅  | ✅  |
| 面试问答（含追问链）                  | ✅  | ✅  | ✅  | ✅  | ✅  |
| 对比板块（规划位置：篇 01）           | ✅  | ——  | ——  | ——  | ——  |
| 参考链接/出处                         | ✅  | ✅  | ✅  | ✅  | ✅  |
| Mermaid 绘图 / 代码围栏配对           | ✅  | ✅  | ✅  | ✅  | ✅  |
| 文档代码 ↔ `src/` 逐字一致            | ——  | ✅  | ✅  | ✅  | ✅  |
| 与 playground / 工程配置一致          | ✅  | ✅  | ✅  | ✅  | ✅  |

> 「逐字一致」是本次审查的亮点发现：5 篇文档中声称「与仓库文件逐字一致」的全部源码块、篇 01 的 package.json/tsconfig/vite.config/.oxlintrc/playground Demo，均与磁盘文件逐字相同——文档即代码，零漂移。

---

## 三、逐篇亮点与不足

#### [01-全景与项目启动.md](./doc/01-全景与项目启动.md) ⭐⭐⭐⭐⭐

**亮点**：

- 版本断言全部实证通过：package.json 各依赖与 `node_modules` 实装版本完全一致（react 19.3.0 / typescript 7.0.2 / vite 8.3.1 / oxlint 1.86.0 / oxfmt 0.71.0）；「版本复验命令链」`bun install && tsc --noEmit && oxlint && vite build && oxfmt` 本次重跑全绿
- 对比板块 1（§3）满足三角对比且落到维度（树的形态/遍历/可中断/优先级/粒度/心智模型），§3.3「答取舍不答优劣」是面试导向的模范写法
- ⚠️「实测」警示框（L153 `@types/react` 漏装报 TS7016）符合「验证发现的坑回写文档」的项目约定
- 面试问答 Q1 完整给出 setState → 屏幕 全链路，为全系列锚点

**不足**：

- 「预计时间 60 分钟」与大纲「每篇 30~60 分钟」持平，但 03/04 为 90 分钟（见 P2-3，跨篇问题，此处仅记录）

#### [02-JSX与createElement.md](./doc/02-JSX与createElement.md) ⭐⭐⭐⭐⭐

**亮点**：

- §2.1 的 jsx-runtime 出口链（`jsx-runtime.js → ReactJSX.js → ReactJSXElement.js`）与 `jsxProd` 三步行为，本次对 React main `ReactJSXElement.js` 逐条核对**全部吻合**——包括 props 复用条件 `!('key' in config)`（源码 L323）与 key 兜底 `config.key !== undefined`（`hasValidKey`，源码 L118）；「为什么 jsx 敢复用 config 而 createElement 不敢」的注释与 React 源码注释同义
- v0 递归 render 明确标注「不进 src/、篇 03 拆掉」，三个伏笔（调用栈/全量重建/无副作用记录）与篇 03/04 一一引爆，演进教学设计出色
- children 四形态表 + false/undefined 边界，为篇 04 分派逻辑埋点准确

**不足**：

- 无实质问题

#### [03-Fiber架构与双缓存树.md](./doc/03-Fiber架构与双缓存树.md) ⭐⭐⭐⭐

**亮点**：

- WorkTag 数值（FunctionComponent=0 / HostRoot=3 / HostComponent=5 / HostText=6）与真实 `ReactWorkTags.js` 对齐无误；「flags 不是 effectTag」「ChildDeletion 标在父节点」两处命名断言准确
- §5 遍历编号图与 performUnitOfWork 的「向下/向右/向上」逐步对应，练习用 debugger 断点对照走查，可操作性强
- §6 mini vs 真实差距表（lanes/subtreeFlags/25+ tag）划清教学版边界，不冒充源码

**不足**：

- **[P0-1] §5 的 `appendAllChildren` 转录走样**（详见问题清单）——文档声称「真实源码同款」，但当前写法在多层宿主嵌套时会把子节点 DOM 用移动语义拽到祖父层，实测 `<li></li>A<li></li>B`（文本成了 ul 的孩子）
- 自检清单「Fiber 的 13 个字段」实际是 14 个（字段表把 child/sibling/return 合并成一行导致的计数偏移）

#### [04-Reconciliation与Diff算法.md](./doc/04-Reconciliation与Diff算法.md) ⭐⭐⭐⭐

**亮点**：

- 全系列最佳的教学演绎：§5.1 lastPlacedIndex 演算表（ABCD→CABD 逐行推演）+ §5.2 两轮分工表 + §6 index-as-key 的实现层推演（「零移动、全错位」「状态串位」），把「不讲烂梗」的大纲承诺兑现了
- `createChildReconciler(shouldTrackSideEffects)` 工厂与真实源码同构，mount/update 双入口的「为什么」讲透了（首挂载标记 Placement 是浪费）
- 删除标父节点 + deletions 数组的设计动机（Q3）解释到位，与篇 05 消费端呼应

**不足**：

- **[P1-1] 第二轮 Map 对无 key 子项的处理偏离真实源码**（详见问题清单）——实测旧列表 `[li(a), 无key文本, 无key文本]` 更新后第一个无 key 文本既未被复用也未被删除（DOM 泄漏）

#### [05-Commit阶段与DOM提交.md](./doc/05-Commit阶段与DOM提交.md) ⭐⭐⭐

**亮点**：

- **源码断言可信度全系列最高**：对 React main（`ReactFiberWorkLoop.js` 5683 行）逐条实证——①`commitRootImpl` 已并入 `commitRoot`（main 中无该符号，`function commitRoot` 在 L3725）；②三大子阶段执行体确实由 `ReactFiberCommitWork.js` 导出（`commitBeforeMutationEffects` L351 / `commitMutationEffects` L2016 / `commitLayoutEffects` L3050）；③`pendingEffectsStatus` 状态机 + `flushLayoutEffects`（L4055）存在；④passive 经 `scheduleCallback(NormalSchedulerPriority)` 异步排（L3806）；⑤`root.current = finishedWork` 卡在 mutation 之后、layout 之前（L4051，紧邻 L4055 的 flushLayoutEffects）——「19.x main 实核」的声明经受住了复核
- §5.1「函数组件无 stateNode 三处占位表」是篇 06 的施工图纸，架构演进意识（「commit 层不因函数组件改动结构」）出色
- Q2-1「mutation 抛异常怎么办」触及真实 React 也存在的硬约束，追问链质量高

**不足**：

- **[P0-2] `commitUpdate` 的 oldProps 取值错误**、**[P0-3] `commitPlacement` 锚点未跳过未提交兄弟**（详见问题清单）——两个 P0 都落在本篇交付的 `commit/index.ts`，直接卡住本篇练习（计数器闭环）的验收

---

## 四、整体评价表

| 维度         |    评分    | 说明                                                                            |
| ------------ | :--------: | ------------------------------------------------------------------------------- |
| 格式规范性   |    9/10    | 全要素合规、零死链、文档-代码零漂移；仅预计时间超出大纲规格                     |
| 代码可运行性 |    6/10    | 单层结构与文本更新全绿；3 个 P0 在常见场景实测复现                              |
| 面试导向性   |   9.5/10   | 每篇「面试可答」+ 追问链，实现层解释不背结论                                    |
| 知识覆盖度   |   9.5/10   | 两阶段/diff/commit/flags/双缓存全覆盖，源码断言逐条实证                         |
| 渐进式学习   |   10/10    | 重构链 + 伏笔回收 + 前向引用显式标注，教科书级衔接                              |
| 对比完整性   |    9/10    | 篇 01 三角对比达标，篇 12 对比板块已预告                                        |
| **总评**     | **7.5/10** | **讲解与结构是范文级；v1 代码闭环的 4 个实测 bug 拉低交付可信度，均为局部修复** |

---

## 五、问题清单（按优先级）

### P0 —— 正确性问题（均已 Tier 2 实测复现，非记忆判断）

1. **[P0] 篇 03 `appendAllChildren` 下钻宿主子节点 → 多层嵌套首挂载结构错乱**

   - 位置：[src/fiber/beginWork.ts](./src/fiber/beginWork.ts#L95-L119)（文档 §5 同款代码块）
   - 现状：`if (node.tag === HostComponent || node.tag === HostText) { appendChild(dom) }` 之后**无条件** `if (node.child !== null) { node = node.child; continue }`——对宿主节点也下钻
   - 实测（已验证）：挂载 `ul > li×3（各含文本）`，结果 `<ul><li></li>A<li></li>B<li></li>C</ul>`——`completeWork(ul)` 的 appendAllChildren 下钻进 li，把已在 li 里的文本节点 `appendChild` 到 ul（appendChild 对已挂载节点是**移动**语义），文本被拽出、li 变空
   - 真实源码（已验证）：`ReactFiberCompleteWork.js` L245 起——宿主节点 `appendInitialChild` 后**不再下钻**，`node = node.child; continue` 仅用于非宿主包装节点（函数组件/Fragment 等找宿主出口）
   - 修复：下钻分支改为 `else if`——只在**非** HostComponent/HostText 时 `node = node.child; continue`：
     ```ts
     if (node.tag === HostComponent || node.tag === HostText) {
       const dom = node.stateNode
       if (dom instanceof Node) {
         parent.appendChild(dom)
       }
     } else if (node.child !== null) {
       node = node.child
       continue
     }
     ```
   - 影响：篇 03/04/05 所有练习（嵌套页面、列表 diff、计数器页）在多层宿主结构下渲染错乱；这是「真实源码同款」声明下的转录走样，必须修

2. **[P0] 篇 05 `commitUpdate` oldProps 取自已写入新值的 `memoizedProps` → 宿主 props 更新静默失效**

   - 位置：[src/commit/index.ts](./src/commit/index.ts#L91-L104)（文档 §5 第 3 段）
   - 现状：`const oldProps = fiber.memoizedProps`——但篇 03 的 `completeWork` 在 render 阶段已把**新 props** 写进 `workInProgress.memoizedProps`（beginWork.ts L60），commit 时 `oldProps === newProps`，`updateProps` 的新旧对比全部命中跳过
   - 实测（已验证）：`className="old"` → `className="new"` 更新后仍为 `"old"`；文本节点更新正常（HostText 分支用的是 `pendingProps`）
   - 修复：从 current 树取旧值——`const oldProps = fiber.alternate !== null ? fiber.alternate.memoizedProps : {}`（与真实 React 的 `commitUpdate` 从 current 取 oldProps 同语义）
   - 影响：篇 05 练习「计数器」里凡是靠 props 表达的 UI 变化全部失效；且这是**静默失败**，断点都看不出异常——正是 §2.6 动态验证存在的原因

3. **[P0] 篇 05 `commitPlacement` 锚点未跳过「尚未提交」的新兄弟 → 连续插入抛 NotFoundError**

   - 位置：[src/commit/index.ts](./src/commit/index.ts#L61-L71)（文档 §4）
   - 现状：锚点查找只看 `fiber.sibling` 链上有无 DOM，不看该兄弟是否本轮才新建（DOM 在 completeWork 已创建但**还没插入**）
   - 实测（已验证）：`[A] → [A, X, Y]`（X、Y 均新建）抛 `DOMException: Failed to execute 'insertBefore' on 'Node'`——X 的锚点取到未挂载的 Y 的 DOM，commit 中途崩溃，DOM 停在半更新态（恰好反证了本篇「commit 不可中断」的教训）
   - 修复方向：锚点查找跳过带 `Placement` 标记的兄弟（对齐 React `getHostSibling` 的「只信已提交 DOM」语义）：
     ```ts
     while (sibling !== null) {
       if ((sibling.flags & Placement) === 0) {
         const dom = toNode(sibling)
         if (dom !== null) {
           anchor = dom
           break
         }
       }
       sibling = sibling.sibling
     }
     ```
   - 影响：任何一次更新里插入 ≥2 个连续新节点即崩溃（如批量追加列表项）

### P1 —— 规范与结构问题

4. **[P1] 篇 04 第二轮 Map 对无 key 子项用 `null` 键互相覆盖 → 节点泄漏**

   - 位置：[src/reconcile/index.ts](./src/reconcile/index.ts#L236-L238)（`existingChildren.set(scan.key, scan)`）与 [L159-L170](./src/reconcile/index.ts#L159-L170)（`updateFromMap` 查 `null`）
   - 实测（已验证）：旧 `[li(key='a'), 无key文本T1, 无key文本T2]` → 新 `[li(key='b'), T3, T4]`：T1 被 T2 覆盖出 Map，最终 deletions 只含 `li(key='a')`，**T1 既未复用也未删除**——其 DOM 在 commit 中永远不会被摘除
   - 真实源码语义：`mapRemainingChildren` 对无 key 旧节点按 `index` 入 Map、`updateFromMap` 对无 key 新子项按 `newIdx` 查
   - 修复：`existingChildren.set(scan.key !== null ? scan.key : scan.index, scan)`；查表改为 `existingChildren.get(newChild.key === null ? newIdx : newChild.key)`（文本分支用 `newIdx`）
   - 影响：index-as-key 之外的「混合 key/无 key 列表」是真实业务常态（如静态表头行 + 动态行），泄漏属渐进累积型 bug

### P2 —— 小瑕疵

5. **[P2] 篇 03 自检「Fiber 的 13 个字段」实际 14 个**：Fiber 类型共 14 个字段（[src/fiber/index.ts](./src/fiber/index.ts#L34-L52)），字段表把 child/sibling/return 合并成一行导致计数偏移。改为「14 个字段」或「13 行字段速查」统一口径。

6. **[P2] `hasPropsChanged` 未排除 `children` 键**（beginWork.ts L79-91）：数组 children 每轮都是新引用，带子元素的宿主节点每轮必标 `Update`（P0-2 修复后 `updateProps` 会跳过 children，无实际危害，但属冗余标记）。建议比对时跳过 `children` 键。

7. **[P2] 预计时间超出大纲规格**：大纲规格声明「每篇一次专注会话（约 30~60 分钟）」，篇 03/04 实标 90 分钟、02/05 标 75 分钟。二选一：大纲放宽为「60~90 分钟」，或文档压缩。建议前者——内容密度值得这个时长。

---

## 六、动态验证记录

**Tier 1（静态实跑，2026-09-28）**：`bun install` → `bunx tsc --noEmit` ✅ → `bun run lint`（oxlint 0 warning 0 error，9 文件 102 规则）✅ → `bunx vite build`（71ms）✅——与篇 01 注脚声称的复验链一致。

**Tier 2（happy-dom 行为闭环，用真实 `src/` 跑 createRoot → render → update）**：

| 场景                                    | 结果                                          | 结论     |
| --------------------------------------- | --------------------------------------------- | -------- |
| A. 宿主 props 更新（className old→new） | ❌ 更新后仍为 `old`                           | P0-2     |
| B. 文本子节点更新（复用同一 text 节点） | ✅ 文本替换、节点引用不变                     | 符合预期 |
| C. 头部插入单节点 `[A]→[X,A]`           | ❌ `<li></li>X<li></li>`（文本被拽出）        | P0-1     |
| D. 尾部连续插入两个新节点 `[A]→[A,X,Y]` | ❌ `DOMException: NotFoundError`，commit 中断 | P0-3     |
| E. 中间删除 `[A,B,C]→[A,C]`             | ❌ 文本被拽出（P0-1 连带）                    | P0-1     |
| F. 移动 `[A,B,C,D]→[C,A,D,B]`           | ❌ 文本被拽出（P0-1 连带）                    | P0-1     |
| G. 混合 key/无 key 列表第二轮 diff      | ❌ 无 key 旧节点泄漏（deletions 缺失）        | P1-1     |

**静态源码核对（React main，jsDelivr 拉取全文 + 本地 grep）**：

| 断言                                                   | 出处                                                                           | 结果                       |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ | -------------------------- |
| `commitRootImpl` 已并入 `commitRoot`                   | `ReactFiberWorkLoop.js` L3725 `function commitRoot`，全文件无 `commitRootImpl` | ✅                         |
| 三大子阶段在 `ReactFiberCommitWork.js`                 | L351 / L2016 / L3050 三个导出                                                  | ✅                         |
| `pendingEffectsStatus` 状态机 / `flushLayoutEffects`   | WorkLoop 31 处引用；`flushLayoutEffects` L4055                                 | ✅                         |
| passive 经 `scheduleCallback(NormalSchedulerPriority)` | L3806                                                                          | ✅                         |
| 双缓存交换在 mutation 后、layout 前                    | `root.current = finishedWork` L4051（flushLayoutEffects L4055）                | ✅                         |
| `appendAllChildren` 宿主节点不下钻                     | `ReactFiberCompleteWork.js` L245 起                                            | ✅（mini 转录走样 → P0-1） |
| jsx props 复用 `!('key' in config)`                    | `ReactJSXElement.js` L323                                                      | ✅（mini 逐字吻合）        |
| `hasValidKey = config.key !== undefined`               | `ReactJSXElement.js` L118                                                      | ✅                         |

---

## 七、总体结论

前五篇的**讲解层是仓库范文级水准**：演进式重构链（v0 只存文档、篇 03 亲手拆掉）、三处前向引用全部显式标注、练习三段式可操作、「面试可答」即答即中；更难得的是源码对照的可信度——篇 05 的四处 main 分支断言、篇 02 的 jsx 行为对照全部经受住逐行复核，这在手写框架类教程里极少见。

**交付层的 v1 渲染器有 4 个实测 bug（3 P0 + 1 P1）**，集中在 mount 拼装、props 提交、插入锚点、无 key diff 四个环节——都是真实 React 源码里有明确对应解法的局部问题（appendAllChildren 的 else-if 下钻约束、从 current 取 oldProps、getHostSibling 跳过未提交兄弟、mapRemainingChildren 按 index 入 Map）。按 P0 → P1 顺序修复并重跑 Tier 2 七场景回归后，本系列即可恢复「代码即交付物」的可信度，建议篇 06 动笔前先完成修复。

> 验证过程说明：所有 P0/P1 判定均附实测输出或源码行号，无凭记忆结论；初始怀疑的「jsx key 边缘差异」经源码核对后撤销。
