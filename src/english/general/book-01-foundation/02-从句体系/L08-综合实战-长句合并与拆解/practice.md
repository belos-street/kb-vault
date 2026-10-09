# L08 练习：综合实战

> 配套 [第 8 讲](lesson.md)。基础层必做，强化层选做。答案在文末，做完再看。

---

## 基础层

**1. 从句成分分析**：从本讲技术短文摘取下列 10 个从句，标出「从句类型 + 引导词 + 整体成分」（用 L01 提问法验证）。

1. Developers know **that code can carry tech debt**, but few notice that a doc can carry it too.
2. Developers know that code can carry tech debt, but few notice **that a doc can carry it too**.
3. We combine **what belongs together**, and separate what hides two ideas.
4. When a passage is no longer accurate, the team **that trusts it** repeats mistakes.
5. We polish each passage until every fact **we keep** is accurate and every command runs.
6. When the review doubts a claim, we revise it immediately, because a doc **that fails the check** must not ship.
7. Because we maintain the flow, docs stay accurate, and readers **who hit delays** now trust every release.
8. **When a passage is no longer accurate**, the team that trusts it repeats mistakes.
9. A colleague verifies every command before we publish, **because a doc nobody can follow is still debt**.
10. We separate a long sentence when its clauses hide two ideas, and adjust it **until the logic is clear**.

**2. 三大从句综合辨析**：用提问法判断加粗从句的类型（① 名词性从句 / ② 定语从句 / ③ 状语从句）。

1. The ticket **that the intern closed** broke the build again.
2. **When the deploy finishes**, the dashboard turns green.
3. The log shows **what the cache job wrote**.
4. We kept the rule **because it prevented a panic**.
5. The expert explained **why the queue was stuck**.

**3. 合并三法定位**：观察每组两个简单句的关系，选择应使用的合并法（① 重复名词 → 定语从句 / ② 先后、因果 → 状语从句 / ③ 陈述作宾、主 → 名词性从句）。

1. The pipeline runs the tests. The pipeline checks every commit.
2. The build failed. The team rolled back the release.
3. The report states it. The migration is complete.
4. The runbook explains it. Why did the service crash?

**4. 连词填空**：填入合适的引导词，把句子补成合格的复合句（每空一个词）。

1. The doc ___ we polished last week is now accurate.
2. ___ the review doubts a claim, we revise it at once.
3. The dashboard confirms ___ the build passed.
4. Nobody knows ___ the cache job failed last night.

---

## 强化层

**5. 合并改写**：把每组两个简单句合并成一个复合句（按指定合并法），在括号里写明你用的引导词。

1. The playbook covers every incident. The team wrote the playbook last quarter.（① 定语从句合并）
2. The tests failed. The pipeline stopped the deploy.（② 状语从句合并）
3. The audit confirmed it. The old cache caused the crash.（③ 名词性从句合并）

**6. 判断下列 4 处正误**：正确的打 ✓，错误的按三大从句规则改正。

1. Although the ticket was small, but it broke the release.
2. The dashboard shows when the backup finished.
3. This playbook, that saves us hours, is now shared with the team.
4. When the cache expires, users will see old data.

---

## 答案

**1.**
1. 名词性从句（宾语从句）｜that 只引导、不作从句成分｜整体作 know 的宾语；提问「知道什么？」
2. 名词性从句（宾语从句）｜that 只引导、不作从句成分｜整体作 notice 的宾语；提问「注意到什么？」
3. 名词性从句（宾语从句）｜what 兼引导词与从句主语（= the thing(s) that，what 作 belongs 的主语）｜整体作 combine 的宾语；提问「合并什么？」
4. 定语从句｜that 兼作从句主语｜整体修饰先行词 the team；提问「什么样的团队？」
5. 定语从句（省略关系代词 that）｜that 作 keep 的宾语被省略｜整体修饰先行词 every fact；提问「什么样的事实？」
6. 定语从句｜that 兼作从句主语｜整体修饰先行词 a doc；提问「什么样的文档？」
7. 定语从句｜who 兼作从句主语｜整体修饰先行词 readers；提问「什么样的读者？」
8. 状语从句（时间）｜when 领起｜修饰整个主句，回答「何时重复犯错？」
9. 状语从句（原因）｜because 领起｜修饰整个主句，回答「为什么还是债？」；从句内部再嵌一个省略 that 的定语从句 nobody can follow（修饰 a doc）
10. 状语从句（时间）｜until 领起｜修饰 adjust，回答「调整到什么时候？」

**2.**
1. ② 定语从句。依据一（提问法）：遮住从句问「什么样的 ticket？」→ 答「什么样的」→ 定语。依据二（成分还原）：that 在从句内作 closed 的宾语，整块可换成 the closed ticket，句子仍通；名词性从句没有先行词可挂、状语从句答不了「哪个」→ 排除①③。
2. ③ 状语从句。依据一（提问法）：「何时 turns green？」→ 答「何时」→ 状语。依据二（移位验证）：从句整体可挪到句尾（The dashboard turns green when the deploy finishes.）句意不变 → 状语成立；名词性 / 定语从句不能这样整体移位。
3. ① 名词性从句。依据一（提问法）：「shows 什么？」→ 答「什么」→ 名词性，整块作 shows 的宾语。依据二（占位还原）：把从句换成一个名词（The log shows the result.）句子仍通；定语从句必须挂在先行词后，此处无先行词 → 排除②。
4. ③ 状语从句。依据一（提问法）：「为何 kept the rule？」→ 答「为何」→ 状语（原因）。依据二（移位验证）：Because it prevented a panic, we kept the rule. 移到句首仍通，且删去后主句完整 → 状语；排除名词性（不是 kept 的宾语）。
5. ① 名词性从句（陷阱：why ≠ 状语）。依据一（提问法）：「explained 什么？」→ 答「什么」→ 名词性，整块作 explained 的宾语。依据二（语序校验）：从句内部是陈述语序（why the queue was stuck），能整体换成 the reason（The expert explained the reason.）→ 名词性成立；答「为何？」的状语从句可以删去而主句仍完整，此处删掉则 explained 悬空 → 排除③。

**3.**
1. ① 定语从句合并（重复名词）。依据一（触发信号）：两句共用名词 the pipeline（重复名词）→ 把一处换成关系代词挂到另一处名词后。依据二（合并还原）：The pipeline that runs the tests checks every commit. 中 that 顶 the pipeline、在从句内作主语，句意 = 两句之和 → 定语合并成立。
2. ② 状语从句合并（先后 / 因果）。依据一（触发信号）：build failed 与 rolled back 有因果 / 先后关系，用 because / after 降级一句。依据二（排除法）：两句没有共用名词（排除①），第二句也不是「说 / 知道」的内容（排除③）→ 只能②。
3. ③ 名词性从句合并（陈述作宾）。依据一（触发信号）：第二句是 states 说的内容（陈述事实作宾语）→ 用 that 塞进宾语位。依据二（合并还原）：The report states that the migration is complete. 中 that 从句整体作宾语、内部陈述语序，句意不变 → 名词性合并成立。
4. ③ 名词性从句合并（陈述作宾）。依据一（触发信号）：第二句是 explains 要说明的内容（疑问形式的陈述）→ 用 why 领起并改陈述语序。依据二（排除法）：合并后 The runbook explains why the service crashed. 中从句坐 explains 的宾语位；定语从句没有先行词、状语从句答不了「解释了什么」→ 排除①②。

**4.**
1. that（或 which）。依据一（语法规则）：从句 ___ we polished last week 中 polished 缺宾语（polish 的对象就是先行词 the doc）→ 用关系代词 that / which 顶宾语位。依据二（排除法）：填 when / where 等关系副词时 polished 仍然缺宾语、句法不完整 → 排除；限制性定语从句 that / which 均可。
2. When。依据一（语法规则）：从句 the review doubts a claim 主谓宾齐全，主句缺时间背景 → when 领起时间状语从句。依据二（移位还原）：We revise it at once when the review doubts a claim. 挪到句尾仍通 → 状语从句成立；填 that 则主句「___ 从句」整块主谓宾不缺、句首悬空 → 排除。
3. that。依据一（语法规则）：confirms 的宾语是一整句陈述「the build passed」，从句内部主谓齐全、引导词不作成分 → that。依据二（还原 / 排除）：把 that 从句换成名词（The dashboard confirms the result.）句式不变；填 what 还原成 the thing that 后从句多出宾语成分、句意不通 → 排除。
4. why。依据一（语法规则）：从句表示「为何失败」，整体作 knows 的宾语（名词性从句），why 兼作句内原因状语。依据二（语序校验）：名词性从句一律陈述语序（why the cache job failed），不能写 why did the cache job fail → 用 why + 陈述语序即为正确形态；填 that 则从句缺原因成分、句意不成立 → 排除。

**5.**（主观题 — 参考要点）
1. The playbook that the team wrote last quarter covers every incident.（或 The team wrote the playbook that covers every incident last quarter.）引导词：that / which
- 要点覆盖：两句合并为 1 句；重复名词 playbook 只保留一处，另一处降级为定语从句（that / which 顶从句成分）；主句保留一套完整主谓
- 自检要点：关系代词在从句内作成分（that = wrote 的宾语）；句中只剩一个主句谓语；不再重复出现两次 playbook
- 达标线：定语从句挂对先行词、从句成分齐全、句意 = 两句之和，即通过
2. When the tests failed, the pipeline stopped the deploy.（或 After the tests failed, …；表因果也可用 Because the tests failed, …）引导词：when / after / because
- 要点覆盖：两句合并为 1 句；用时间或原因连词把「测试失败」降级为状语从句；主句完整（the pipeline stopped the deploy）
- 自检要点：全句只留一个连接词（because 不与 so 同框）；状语从句自带主谓；连词的语义（先后 / 因果）与你的意图一致
- 达标线：状语从句类型与逻辑匹配、无双连接词、句意 = 两句之和，即通过
3. The audit confirmed that the old cache caused the crash. 引导词：that
- 要点覆盖：两句合并为 1 句；第二句作为「确认的内容」用 that 从句整体坐进 confirmed 的宾语位
- 自检要点：that 只引导、不作从句成分（the old cache caused the crash 主谓宾齐全）；从句内部陈述语序（不是 did the old cache cause）
- 达标线：that 从句作宾语、内部语序正确、句意 = 两句之和，即通过

**6.**
1. ❌ Although the ticket was small, it broke the release.（或 The ticket was small, but it broke the release.）依据一（语法规则）：although 与 but 不同框 —— 让步关系只用一个连接词。依据二（二选一还原）：留 although 去 but、或留 but 去 although，任取一种句法就完整；两个都留则出现双连接词 → 原句错。
2. ✓ 正确。依据一（语法规则）：when 引导的名词性从句（shows 的宾语）用陈述语序（the backup finished），语序无误。依据二（占位还原）：把从句换成名词（The dashboard shows the time.）句子仍通 → 名词性从句成立；若作状语从句解读，shows 后将悬空缺宾语 → 排除，故按名词性从句判定，原句正确。
3. ❌ This playbook, which saves us hours, is now shared with the team. 依据一（语法规则）：逗号隔开的是非限制性定语从句（补充说明），不能用 that（L04 规则）→ 换 which。依据二（排除法）：that 禁入非限制性定语从句；who 指人、where 指地点都指代不了 the playbook → 只能 which。
4. ✓ 正确。依据一（语法规则）：when 引导的时间状语从句用一般现在表将来（主将从现），从句 expires 用一般现在、主句 will see 表将来，结构正确。依据二（改写检验）：从句若写 will expire 就违反主将从现；删去从句后主句仍完整 → 原句是合格的条件时间复合句，正确。
