# 第 3 章练习：向量组与线性相关性

> 配套 [doc/ch3-vectors-and-independence.md](../doc/ch3-vectors-and-independence.md)。难度分三档：B（基础）/ S（强化）/ T（真题级）；答案与解析统一在本文件末尾。

## 一、基础巩固（B1-B4，限时 5-8 分钟/题）

**B1（解答）**：设 $\alpha_1 = (1, 0, 1)^T$ ， $\alpha_2 = (0, 1, 1)^T$ ， $\beta = (2, -1, 3)^T$ 。判断 $\beta$ 能否由 $\alpha_1, \alpha_2$ 线性表示，说明理由。

**B2（填空）**：设 $\alpha_1 = (1, 0, 1)^T$ ， $\alpha_2 = (0, 1, 1)^T$ ， $\alpha_3 = (1, 1, t)^T$ ，则 $\alpha_1, \alpha_2, \alpha_3$ 线性相关的充要条件是 $t =$＿＿＿。

**B3（解答）**：设 $\alpha_1 = (1, 2, 3)^T$ ， $\alpha_2 = (2, 3, 4)^T$ ， $\alpha_3 = (3, 4, 5)^T$ ， $\alpha_4 = (4, 5, 6)^T$ 。求一个极大无关组，并把其余向量用该组线性表示。

**B4（解答）**：设 $\alpha_1 = (1, 2, 2)^T$ ， $\alpha_2 = (2, 1, 2)^T$ ，用施密特正交化将其标准正交化。

## 二、强化提升（S1-S4，限时 10-15 分钟/题）

**S1（选择）**：下列命题正确的是（　）。

(1) 若 $\alpha_1, \cdots, \alpha_s$ 线性相关， $\beta_1, \cdots, \beta_t$ 线性相关，则合并组 $\alpha_1, \cdots, \alpha_s, \beta_1, \cdots, \beta_t$ 线性相关；(2) 若两组各自线性无关，则合并组线性无关；(3) 若 $\beta$ 可由线性无关组 $\alpha_1, \cdots, \alpha_s$ 线性表示，则表示式唯一；(4) 若部分组线性相关，则整体线性相关；(5) $n + 1$ 个 $n$ 维向量必线性相关。

A. (1)(3)(4)　　B. (1)(3)(4)(5)　　C. (2)(4)(5)　　D. (1)(2)(4)(5)

**S2（解答）**：设 $\alpha_1 = (1, 0, 2)^T$ ， $\alpha_2 = (2, 1, 0)^T$ ， $\alpha_3 = (\lambda, 1, 4)^T$ 。求向量组 $\alpha_1, \alpha_2, \alpha_3$ 的秩；当秩为 $2$ 时，写出一个极大无关组，并用该组线性表示 $\alpha_3$ 。

**S3（证明）**：设 $\alpha_1, \alpha_2, \alpha_3$ 线性无关，证明 $\alpha_1 + 2\alpha_2$ ， $\alpha_2 + 2\alpha_3$ ， $\alpha_3 + 2\alpha_1$ 线性无关。

**S4（解答）**：设 $\alpha_1, \alpha_2$ 线性无关， $\beta_1 = \alpha_1 + \alpha_2$ ， $\beta_2 = \alpha_1 - \alpha_2$ 。(1) 证明 $\beta_1, \beta_2$ 线性无关，并用 $\beta_1, \beta_2$ 表示 $\alpha_1, \alpha_2$ ，说明两向量组等价；(2) 在此基础上再设 $\alpha_1, \alpha_2, \alpha_3$ 线性无关，令 $\beta_3 = \alpha_1 + \lambda\alpha_3$ ，讨论 $\lambda$ 取何值时向量组 $\beta_1, \beta_2, \beta_3$ 与 $\alpha_1, \alpha_2, \alpha_3$ 等价；不等价时比较两组的秩，并指出哪个方向的线性表示不成立。

## 三、真题级（T1-T2，限时 15-25 分钟/题）

**T1（解答）**：设 $\alpha_1, \alpha_2, \alpha_3$ 线性无关，问 $l$ 、 $m$ 满足什么条件时，向量组 $l\alpha_2 - \alpha_1$ ， $m\alpha_3 - \alpha_2$ ， $\alpha_1 - \alpha_3$ 也线性无关？

**T2（证明）**：设向量组 (I) 可由向量组 (II) 线性表示，但 (II) 不能由 (I) 线性表示。证明： $r(\text{II}) > r(\text{I})$ 。

---

## 答案与解析

### B1
对增广矩阵 $(\alpha_1, \alpha_2 \mid \beta)$ 作初等行变换：

$$\left(\begin{array}{cc|c} 1 & 0 & 2 \\ 0 & 1 & -1 \\ 1 & 1 & 3 \end{array}\right) \xrightarrow{r_3 - r_1 - r_2} \left(\begin{array}{cc|c} 1 & 0 & 2 \\ 0 & 1 & -1 \\ 0 & 0 & 2 \end{array}\right)$$

出现 $0 = 2$ 型矛盾行， $r(\alpha_1, \alpha_2) = 2 \ne 3 = r(\alpha_1, \alpha_2, \beta)$ ，故 $\beta$ **不能**由 $\alpha_1, \alpha_2$ 线性表示。

（几何解读： $\alpha_1, \alpha_2$ 张成平面 $x_1 + x_2 - x_3 = 0$ ，而 $\beta$ 不在该平面上。）

（易错点：只答"不能表示"而不写秩等式 $r(\alpha_1, \alpha_2) = 2 \ne 3 = r(\alpha_1, \alpha_2, \beta)$ 或矛盾方程 $0 = 2$ ，不得全分。）

### B2
3 个 3 维向量，算行列式：

$$\begin{vmatrix} 1 & 0 & 1 \\ 0 & 1 & 1 \\ 1 & 1 & t \end{vmatrix} = 1 \cdot (t - 1) - 0 + 1 \cdot (0 - 1) = t - 2$$

线性相关 $\iff t = 2$ （此时 $\alpha_3 = \alpha_1 + \alpha_2 = (1, 1, 2)^T$ ✓）。

### B3
按列摆成矩阵，行变换化行最简形：

$$\begin{pmatrix} 1 & 2 & 3 & 4 \\ 2 & 3 & 4 & 5 \\ 3 & 4 & 5 & 6 \end{pmatrix} \xrightarrow[r_3 - 3r_1]{r_2 - 2r_1} \begin{pmatrix} 1 & 2 & 3 & 4 \\ 0 & -1 & -2 & -3 \\ 0 & -2 & -4 & -6 \end{pmatrix} \xrightarrow[r_3 - 2r_2]{r_2 \times (-1),\ r_1 + 2r_2} \begin{pmatrix} 1 & 0 & -1 & -2 \\ 0 & 1 & 2 & 3 \\ 0 & 0 & 0 & 0 \end{pmatrix}$$

主元在第 $1$ 、 $2$ 列，极大无关组取 $\{\alpha_1, \alpha_2\}$ ，秩为 $2$ 。读第 $3$ 、 $4$ 列系数：

$$\alpha_3 = -\alpha_1 + 2\alpha_2, \qquad \alpha_4 = -2\alpha_1 + 3\alpha_2$$

验算： $-(1,2,3) + 2(2,3,4) = (3,4,5)$ ✓； $-2(1,2,3) + 3(2,3,4) = (4,5,6)$ ✓。

### B4
$$\beta_1 = \alpha_1 = (1, 2, 2)^T, \qquad (\alpha_2, \beta_1) = 8, \quad (\beta_1, \beta_1) = 9$$

（提示：中间结果可数乘取整，原因是数乘不破坏正交性、也不改变单位化结果，故下面把 $\beta_2$ 取整为 $\gamma_2$ 再继续计算。）

$$\beta_2 = \alpha_2 - \frac{8}{9}\beta_1 = \left(\frac{10}{9}, -\frac{7}{9}, \frac{2}{9}\right)^T \xrightarrow{\text{取整向量}} \gamma_2 = (10, -7, 2)^T$$

验算正交： $(1,2,2) \cdot (10,-7,2) = 10 - 14 + 4 = 0$ ✓。单位化：

$$\eta_1 = \frac{1}{3}(1, 2, 2)^T, \qquad \eta_2 = \frac{1}{3\sqrt{17}}(10, -7, 2)^T$$

### S1
- (1) 对： $\alpha$ 组的不全为零组合系数配上 $\beta$ 部分的全零系数，即为合并组的不全为零组合；
- (2) 错：反例 $\beta_1 = \alpha_1$ ；
- (3) 对：表示唯一性定理；
- (4) 对：部分相关 $\Rightarrow$ 整体相关；
- (5) 对： $n$ 维向量组的秩不超过 $n$ 。

选 **B**（(2) 是唯一错误项）。

### S2
方法选择依据： $3$ 个 $3$ 维向量，先算行列式对 $\lambda$ 分类定秩（最快路径）；秩为 $2$ 的情形再用行最简形读出极大无关组与表示系数。按列摆成矩阵，计算行列式：

$$\begin{vmatrix} 1 & 2 & \lambda \\ 0 & 1 & 1 \\ 2 & 0 & 4 \end{vmatrix} = 1 \cdot (4 - 0) - 2 \cdot (0 - 2) + \lambda \cdot (0 - 2) = 8 - 2\lambda$$

- $\lambda \ne 4$ 时行列式不为 $0$ ，秩为 $3$ ，向量组线性无关，极大无关组即全组本身；
- $\lambda = 4$ 时秩为 $2$ ，此时行变换化行最简形：

$$\begin{pmatrix} 1 & 2 & 4 \\ 0 & 1 & 1 \\ 2 & 0 & 4 \end{pmatrix} \xrightarrow{r_3 - 2r_1} \begin{pmatrix} 1 & 2 & 4 \\ 0 & 1 & 1 \\ 0 & -4 & -4 \end{pmatrix} \xrightarrow[r_1 - 2r_2]{r_3 + 4r_2} \begin{pmatrix} 1 & 0 & 2 \\ 0 & 1 & 1 \\ 0 & 0 & 0 \end{pmatrix}$$

主元在第 $1$ 、 $2$ 列，极大无关组取 $\{\alpha_1, \alpha_2\}$ ，读第 $3$ 列得

$$\alpha_3 = 2\alpha_1 + \alpha_2$$

验算： $2(1, 0, 2) + (2, 1, 0) = (4, 1, 4) = \alpha_3$ ✓。独立复核秩：对含 $\lambda$ 的矩阵作同序行变换得上三角 $\begin{pmatrix} 1 & 2 & \lambda \\ 0 & 1 & 1 \\ 0 & 0 & 8 - 2\lambda \end{pmatrix}$ ，对角线乘积 $8 - 2\lambda$ 与行列式的零点 $\lambda = 4$ 一致 ✓；特值回代：取 $\lambda = 0$ ， $\alpha_3 = (0, 1, 4)^T$ ，行列式 $= 8 \ne 0$ ，秩为 $3$ ，与通式吻合 ✓。

易错点：答"秩为 $2$"必须同时给出参数取值 $\lambda = 4$ ，分类不完整直接扣分； $\lambda \ne 4$ 的分支也要写明"极大无关组为全组"，只答"线性无关"不点破秩不得全分。

### S3
定义法。设 $k_1(\alpha_1 + 2\alpha_2) + k_2(\alpha_2 + 2\alpha_3) + k_3(\alpha_3 + 2\alpha_1) = 0$ ，整理：

$$(k_1 + 2k_3)\alpha_1 + (2k_1 + k_2)\alpha_2 + (2k_2 + k_3)\alpha_3 = 0$$

由 $\alpha_1, \alpha_2, \alpha_3$ 无关，系数全为零：

$$\begin{cases} k_1 + 2k_3 = 0 \\ 2k_1 + k_2 = 0 \\ 2k_2 + k_3 = 0 \end{cases}$$

系数行列式 $\begin{vmatrix} 1 & 0 & 2 \\ 2 & 1 & 0 \\ 0 & 2 & 1 \end{vmatrix} = 1 + 8 = 9 \ne 0$ ，故只有零解 $k_1 = k_2 = k_3 = 0$ ，新组线性无关。∎

（一般结论：无关组经"系数行列式不为零"的线性替换后仍无关。）

### S4
**(1)** 设 $k_1\beta_1 + k_2\beta_2 = 0$ ，即 $(k_1 + k_2)\alpha_1 + (k_1 - k_2)\alpha_2 = 0$ 。由 $\alpha_1, \alpha_2$ 无关：

$$k_1 + k_2 = 0, \qquad k_1 - k_2 = 0 \implies k_1 = k_2 = 0$$

故 $\beta_1, \beta_2$ 线性无关。

反解：两式相加得 $\alpha_1 = \dfrac{\beta_1 + \beta_2}{2}$ ，相减得 $\alpha_2 = \dfrac{\beta_1 - \beta_2}{2}$ 。 $\alpha$ 组与 $\beta$ 组互相可线性表示，故**等价**（同为无关组且个数相等，秩均为 $2$ ）。

**(2)** 方法选择依据： $\beta_1, \beta_2, \beta_3$ 都是 $\alpha_1, \alpha_2, \alpha_3$ 的线性组合，"$\beta$ 组可由 $\alpha$ 组表示"恒成立；由等价的秩判定，两组等价 $\iff r(\alpha\text{组}) = r(\beta\text{组}) = r(\alpha\text{组}, \beta\text{组})$ ，故问题化为 $\beta$ 组何时线性无关。

设 $k_1\beta_1 + k_2\beta_2 + k_3\beta_3 = 0$ ，整理：

$$(k_1 + k_2 + k_3)\alpha_1 + (k_1 - k_2)\alpha_2 + \lambda k_3\alpha_3 = 0$$

由 $\alpha_1, \alpha_2, \alpha_3$ 无关：

$$\begin{cases} k_1 + k_2 + k_3 = 0 \\ k_1 - k_2 = 0 \\ \lambda k_3 = 0 \end{cases}$$

（该方程组的系数行列式 $= -2\lambda$ ，与直接求解互为印证。）

- $\lambda \ne 0$ 时： $k_3 = 0$ ，进而 $k_1 = k_2 = 0$ ， $\beta$ 组线性无关， $r(\beta\text{组}) = 3 = r(\alpha\text{组})$ ，合并矩阵的秩也为 $3$ ，两组**等价**。反向表示可写出： $\alpha_1 = \dfrac{\beta_1 + \beta_2}{2}$ ， $\alpha_2 = \dfrac{\beta_1 - \beta_2}{2}$ ， $\alpha_3 = \dfrac{1}{\lambda}\left(\beta_3 - \dfrac{\beta_1 + \beta_2}{2}\right)$ ；
- $\lambda = 0$ 时： $\beta_3 = \alpha_1$ ，取 $k_1 = k_2 = -\dfrac{1}{2}$ ， $k_3 = 1$ （不全为零）， $-\dfrac{1}{2}\beta_1 - \dfrac{1}{2}\beta_2 + \beta_3 = 0$ ， $\beta$ 组线性相关， $r(\beta\text{组}) = 2 < 3 = r(\alpha\text{组})$ ，两组**不等价**。方向上： $\beta$ 组仍可由 $\alpha$ 组表示，但 $\beta$ 组的每个向量中 $\alpha_3$ 的系数都是 $0$ ，故 $\alpha_3$ 不能由 $\beta$ 组表示，即"$\alpha$ 组可由 $\beta$ 组表示"这一方向不成立。

验算（特值回代）： $\lambda = 1$ 时 $\beta_3 = \alpha_1 + \alpha_3$ ，则 $\beta_3 - \dfrac{\beta_1 + \beta_2}{2} = \alpha_1 + \alpha_3 - \alpha_1 = \alpha_3$ ✓，反向表示成立，与等价结论一致； $\lambda = 0$ 时 $-\dfrac{1}{2}(\alpha_1 + \alpha_2) - \dfrac{1}{2}(\alpha_1 - \alpha_2) + \alpha_1 = 0$ ✓，非零组合存在，与相关结论一致。

易错点：只验证"$\beta$ 组可由 $\alpha$ 组表示"就断言等价（等价必须双向成立）； $\lambda = 0$ 时结论不是"两组毫无关系"，而是"单向可表示且秩不等"。

### T1
定义法。设 $k_1(l\alpha_2 - \alpha_1) + k_2(m\alpha_3 - \alpha_2) + k_3(\alpha_1 - \alpha_3) = 0$ ，整理：

$$(-k_1 + k_3)\alpha_1 + (lk_1 - k_2)\alpha_2 + (mk_2 - k_3)\alpha_3 = 0$$

由 $\alpha_1, \alpha_2, \alpha_3$ 无关得齐次方程组

$$\begin{cases} -k_1 + k_3 = 0 \\ lk_1 - k_2 = 0 \\ mk_2 - k_3 = 0 \end{cases}$$

其系数行列式（按第 1 行展开）：

$$\begin{vmatrix} -1 & 0 & 1 \\ l & -1 & 0 \\ 0 & m & -1 \end{vmatrix} = (-1)\begin{vmatrix} -1 & 0 \\ m & -1 \end{vmatrix} + 1 \cdot \begin{vmatrix} l & -1 \\ 0 & m \end{vmatrix} = -1 + lm$$

新组线性无关 $\iff$ 方程组只有零解 $\iff lm - 1 \ne 0$ ，即

$$lm \ne 1$$

（特值验算： $l = m = 1$ 时三向量之和 $(\alpha_2 - \alpha_1) + (\alpha_3 - \alpha_2) + (\alpha_1 - \alpha_3) = 0$ 为零向量，线性相关，与 $lm = 1$ 一致 ✓。）

### T2
反证。由 (I) 可由 (II) 表示，得 $r(\text{I}) \le r(\text{II})$ 。假设 $r(\text{II}) = r(\text{I}) = r$ ，取 (I) 的极大无关组 $\alpha_1, \cdots, \alpha_r$ 与 (II) 的极大无关组 $\beta_1, \cdots, \beta_r$ 。

$\alpha_1, \cdots, \alpha_r$ 可由 (II) 表示，从而可由 $\beta_1, \cdots, \beta_r$ 表示；又两组都含 $r$ 个线性无关向量且 $\alpha$ 组秩为 $r$ ，由"无关组添加表示向量"的定理， $\beta_1, \cdots, \beta_r$ 也可由 $\alpha_1, \cdots, \alpha_r$ 表示，于是两极大无关组**等价**。

(II) 中任一向量可由 $\beta_1, \cdots, \beta_r$ 表示，而 $\beta$ 组可由 $\alpha$ 组表示， $\alpha$ 组可由 (I) 表示，于是 (II) 整组可由 (I) 线性表示——与已知矛盾。故 $r(\text{II}) > r(\text{I})$ 。∎

（核心引理链：表示不增秩 + 等价向量组同秩 + "秩相等的无关组互相表示"。）