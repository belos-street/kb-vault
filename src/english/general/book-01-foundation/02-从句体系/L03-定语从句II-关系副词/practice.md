# L03 练习：定语从句 II

> 配套 [第 3 讲](lesson.md)。基础层必做，强化层选做。答案在文末，做完再看。

---

## 基础层

**1. 选择关系词**：用「还原介词法」判断从句缺什么，从下列关系词中选一个填空（① where / ② when / ③ why / ④ that）。

1. This is the room ___ we hold the incident review.
2. I still remember the night ___ the database went down.
3. Tell me the reason ___ the build turned red.
4. The hour ___ we spent on the rollback felt endless.
5. The city ___ our data center is located is far from the coast.

**2. 填空（介词 + which）**：把关系副词改写成「介词 + which」变体，把介词填进横线。

1. The meeting room ___ which we ran the review was tiny.
2. The two hours ___ which the dashboard stayed red felt endless.
3. The reason ___ which the deploy failed is clear now.
4. The morning ___ which the tests last passed was quiet.

**3. 改错**：下列句子的关系词使用有误，找出并改正。

1. This is the time when we spent checking the logs.
2. The reason why the pipeline broke is because a lock expired.
3. The shelf which the backup drive sits is locked.
4. The week which the migration ran was full of alerts.

**4. 翻译**（用关系副词或「介词 + which」）：

1. 这就是我们进行事故复盘的会议室。
2. 我还记得数据库宕机的那一晚。
3. 流水线中断的原因是一个过期的锁。

---

## 强化层

**5. 判断下列 4 处正误**：正确的打 ✓，错误的改正。

1. The office in which the team works is on the third floor.
2. That is the reason why we added the check.
3. The hour when the team spent on the rollback was painful.
4. The reason is because a line was missing.

**6. 造句**：以你经历过的一次线上事故或工作失误为主题写 4~5 句英文复盘，至少含 2 个关系副词（where / when / why 不限组合）和 1 个「介词 + which」变体，写完用「还原介词法」逐句自检。

---

## 答案

**1.**
1. ① where（= in which）。依据一（语法规则）：从句 we hold the incident review 主谓宾齐全，缺的是地点状语 → 关系副词；that 站不了状语位。依据二（还原法）：We hold the incident review **in the room** 成立 → 状语缺口 → where。
2. ② when。依据一（语法规则）：从句 the database went down 主谓完整，缺时间状语 → when。依据二（还原法）：The database went down **on the night** 成立；填 that 会要求从句缺主宾，排除。
3. ③ why（= for which）。依据一（语法规则）：先行词 reason、从句 the build turned red 主谓完整 → why。依据二（还原法）：The build turned red **for the reason** 成立 → 原因状语缺口；排除 that。
4. ④ that（= which）。依据一（语法规则）：从句 we spent 后面宾语悬空，the hour 是 spent 的宾语 → 关系代词，不能用 when。依据二（还原法）：**We spent the hour** on the rollback 成立 → 缺宾语，when 只作状语，排除。
5. ① where。依据一（语法规则）：从句 our data center is located 主谓完整，缺地点状语 → where。依据二（还原法）：Our data center is located **in the city** 成立 → 状语缺口。

**2.**
1. in。依据一（语法规则）：run the review 的固定搭配是 run the review **in** the room → in which。依据二（还原法）：We ran the review **in the meeting room** 成立 → 介词用 in。
2. during。依据一（语法规则）：先行词 the two hours 是时间段，从句动作持续该时段 → during which。依据二（改写还原）：The dashboard stayed red **during the two hours** 成立 → during。
3. for。依据一（语法规则）：reason 的搭配是 the reason **for** sth，for which = why。依据二（还原法）：The deploy failed **for the reason** 成立 → for。
4. on。依据一（语法规则）：具体某天上午 / 某天用介词 on（on Friday morning）→ on which。依据二（还原法）：The tests last passed **on the morning** 成立 → on。

**3.**
1. This is the time **that** we spent checking the logs.（或 which，或省略）— 依据一（语法规则）：the time 是 spent 的宾语，缺宾语用关系代词，when 只作状语。依据二（还原法）：**We spent the time** checking the logs 成立 → 缺宾语；换成 when 后从句站不住。
2. The reason why the pipeline broke is **that** a lock expired.（或 The reason for the broken pipeline is a lock.）— 依据一（语法规则）：reason 与 because 语义重复，表语从句用 that 引导。依据二（改写法）：删掉 because 后句子成立（The reason is that a lock expired.），原句双重标记原因 → 冗余。
3. The shelf **where** the backup drive sits is locked.（或 on which）— 依据一（语法规则）：从句 the backup drive sits 主谓齐全、缺地点状语 → 关系副词，which 只能作主宾。依据二（还原法）：The backup drive sits **on the shelf** 成立 → 状语缺口；which 无法还原。
4. The week **when** the migration ran was full of alerts.（或 during which）— 依据一（语法规则）：从句 the migration ran 主谓完整，缺时间状语 → when / during which。依据二（还原法）：The migration ran **during the week** 成立 → 状语缺口，which 站不了状语位。

**4.**
1. This is the meeting room where we ran the incident review.（或 This is the meeting room in which we ran the incident review.）
2. I still remember the night when the database went down.（或 I still remember the night the database went down.）
3. The reason why the pipeline broke was an expired lock.（或 The reason for which the pipeline broke was an expired lock.）
- 要点覆盖：三句分别覆盖 where / when / why 三个关系副词（或各自的「介词 + which」变体），均使用定语从句
- 自检要点：逐句还原验证（We ran the review **in the meeting room** / The database went down **on the night** / The pipeline broke **for the reason**）；从句主谓齐全、不缺主宾；介词与动词搭配一致
- 达标线：三处关系词（或介词 + which）选择全部正确、主干无错，即通过

**5.**
1. ✅ 正确。依据一（语法规则）：in which = where 的正式变体，从句 the team works 主谓完整、缺地点状语。依据二（还原法）：The team works **in the office** 成立 → 状语缺口，in which 合法。
2. ✅ 正确。依据一（语法规则）：先行词 reason 用 why 引导定语从句，从句 we added the check 主谓宾完整。依据二（还原法）：We added the check **for the reason** 成立 → 原因状语缺口，why = for which。
3. ❌ The hour **that** the team spent on the rollback was painful.（或 which，或省略）— 依据一（语法规则）：the hour 是 spent 的宾语，缺宾语用关系代词，when 不能作宾语。依据二（还原法）：The team spent **the hour** on the rollback 成立 → 缺宾语。
4. ❌ The reason is **that** a line was missing.（或直接说 A line was missing.）— 依据一（语法规则）：reason 与 because 语义重复，属冗余错误。依据二（改写法）：换成 that 后句子成立；或删去 The reason is，只留 A line was missing.。

**6.**（主观题 — 参考要点，示例句见课文第 4 节）
- 要点覆盖：4~5 句、主题为一次事故 / 失误复盘、至少 2 个关系副词（where / when / why 不限组合）+ 1 个「介词 + which」变体
- 自检要点：逐句用「还原介词法」还原（先行词带介词放回从句是否成立）；关系副词的从句必须主谓完整、不缺主宾；time / hour / moment 类先行词作宾语时用 that / which 而非 when
- 达标线：每处关系词与从句缺口匹配，2 个关系副词 + 1 个介词 + which 全部用对，即通过
