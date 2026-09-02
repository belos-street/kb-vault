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

**S2（解答）**：设 $\alpha_1 = (1, 1, 1)^T$ ， $\alpha_2 = (2, 3, 4)^T$ ， $\alpha_3 = (3, 5, \lambda)^T$ ，讨论 $\lambda$ 取何值时向量组线性相关；相关时写出一个线性关系式。（测试锚点）

**S3（证明）**：设 $\alpha_1, \alpha_2, \alpha_3$ 线性无关，证明 $\alpha_1 + 2\alpha_2$ ， $\alpha_2 + 2\alpha_3$ ， $\alpha_3 + 2\alpha_1$ 线性无关。

**S4（解答）**：设 $\alpha_1, \alpha_2$ 线性无关， $\beta_1 = \alpha_1 + \alpha_2$ ， $\beta_2 = \alpha_1 - \alpha_2$ 。证明 $\beta_1, \beta_2$ 线性无关，并用 $\beta_1, \beta_2$ 表示 $\alpha_1, \alpha_2$ ，说明两向量组等价。

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

### B2
3 个 3 维向量，算行列式：

$$\begin{vmatrix} 1 & 0 & 1 \\ 0 & 1 & 1 \\ 1 & 1 & t \end{vmatrix} = 1 \cdot (t - 1) - 0 + 1 \cdot (0 - 1) = t - 2$$

线性相关 $\iff t = 2$ （此时 $\alpha_3 = \alpha_1 + \alpha_2 = (1, 1, 2)^T$ ✓）。

### B3
按列摆成矩阵，行变换化行最简形：

$$\begin{pmatrix} 1 & 2 & 3 & 4 \\ 2 & 3 & 4 & 5 \\ 3 & 4 & 5 & 6 \end{pmatrix} \xrightarrow[r_3 - 3r_1]{r_2 - 2r_1} \begin{pmatrix} 1 & 2 & 3 & 4 \\ 0 & -1 & -2 & -3 \\ 0 & -2 & -4 & -6 \end{pmatrix} \xrightarrow[r_3 - 2r_2]{r_2 \times (-1)} \begin{pmatrix} 1 & 0 & -1 & -2 \\ 0 & 1 & 2 & 3 \\ 0 & 0 & 0 & 0 \end{pmatrix}$$

主元在第 $1$ 、 $2$ 列，极大无关组取 $\{\alpha_1, \alpha_2\}$ ，秩为 $2$ 。读第 $3$ 、 $4$ 列系数：

$$\alpha_3 = -\alpha_1 + 2\alpha_2, \qquad \alpha_4 = -2\alpha_1 + 3\alpha_2$$

验算： $-(1,2,3) + 2(2,3,4) = (3,4,5)$ ✓； $-2(1,2,3) + 3(2,3,4) = (4,5,6)$ ✓。

### B4
$$\beta_1 = \alpha_1 = (1, 2, 2)^T, \qquad (\alpha_2, \beta_1) = 8, \quad (\beta_1, \beta_1) = 9$$

$$\beta_2 = \alpha_2 - \frac{8}{9}\beta_1 = \left(\frac{10}{9}, -\frac{7}{9}, \frac{2}{9}\right)^T \xrightarrow{\text{取整向量}} \gamma_2 = (10, -7, 2)^T$$

验算正交： $(1,2,2) \cdot (10,-7,2) = 10 - 14 + 4 = 0$ ✓。单位化：

$$\eta_1 = \frac{1}{3}(1, 2, 2)^T, \qquad \eta_2 = \frac{1}{3\sqrt{17}}(10, -7, 2)^T$$

（中间结果数乘不破坏正交性，也不改变单位化结果。）

### S1
- (1) 对： $\alpha$ 组的不全为零组合系数配上 $\beta$ 部分的全零系数，即为合并组的不全为零组合；
- (2) 错：反例 $\beta_1 = \alpha_1$ ；
- (3) 对：表示唯一性定理；
- (4) 对：部分相关 $\Rightarrow$ 整体相关；
- (5) 对： $n$ 维向量组的秩不超过 $n$ 。

选 **B**（(2) 是唯一错误项）。

### S2
3 个 3 维向量，算行列式（按列摆）：

$$\begin{vmatrix} 1 & 2 & 3 \\ 1 & 3 & 5 \\ 1 & 4 & \lambda \end{vmatrix} = 1(3\lambda - 20) - 2(\lambda - 5) + 3(4 - 3) = \lambda - 7$$

- $\lambda = 7$ 时线性相关，行最简形为 $\begin{pmatrix} 1 & 0 & -1 \\ 0 & 1 & 2 \\ 0 & 0 & 0 \end{pmatrix}$ ，读出关系 $\alpha_3 = -\alpha_1 + 2\alpha_2$ （验算： $-(1,1,1) + 2(2,3,4) = (3,5,7)$ ✓）；
- $\lambda \ne 7$ 时线性无关。

### S3
定义法。设 $k_1(\alpha_1 + 2\alpha_2) + k_2(\alpha_2 + 2\alpha_3) + k_3(\alpha_3 + 2\alpha_1) = 0$ ，整理：

$$(k_1 + 2k_3)\alpha_1 + (2k_1 + k_2)\alpha_2 + (2k_2 + k_3)\alpha_3 = 0$$

由 $\alpha_1, \alpha_2, \alpha_3$ 无关，系数全为零：

$$\begin{cases} k_1 + 2k_3 = 0 \\ 2k_1 + k_2 = 0 \\ 2k_2 + k_3 = 0 \end{cases}$$

系数行列式 $\begin{vmatrix} 1 & 0 & 2 \\ 2 & 1 & 0 \\ 0 & 2 & 1 \end{vmatrix} = 1 + 8 = 9 \ne 0$ ，故只有零解 $k_1 = k_2 = k_3 = 0$ ，新组线性无关。∎

（一般结论：无关组经"系数行列式不为零"的线性替换后仍无关。）

### S4
设 $k_1\beta_1 + k_2\beta_2 = 0$ ，即 $(k_1 + k_2)\alpha_1 + (k_1 - k_2)\alpha_2 = 0$ 。由 $\alpha_1, \alpha_2$ 无关：

$$k_1 + k_2 = 0, \qquad k_1 - k_2 = 0 \implies k_1 = k_2 = 0$$

故 $\beta_1, \beta_2$ 线性无关。

反解：两式相加得 $\alpha_1 = \dfrac{\beta_1 + \beta_2}{2}$ ，相减得 $\alpha_2 = \dfrac{\beta_1 - \beta_2}{2}$ 。 $\alpha$ 组与 $\beta$ 组互相可线性表示，故**等价**（同为无关组且个数相等，秩均为 $2$ ）。

### T1
定义法。设 $k_1(l\alpha_2 - \alpha_1) + k_2(m\alpha_3 - \alpha_2) + k_3(\alpha_1 - \alpha_3) = 0$ ，整理：

$$(-k_1 + k_3)\alpha_1 + (lk_1 - k_2)\alpha_2 + (mk_2 - k_3)\alpha_3 = 0$$

由 $\alpha_1, \alpha_2, \alpha_3$ 无关得齐次方程组

$$\begin{cases} -k_1 + k_3 = 0 \\ lk_1 - k_2 = 0 \\ mk_2 - k_3 = 0 \end{cases}$$

其系数行列式（按第 1 行展开）：

$$\begin{vmatrix} -1 & 0 & 1 \\ l & -1 & 0 \\ 0 & m & -1 \end{vmatrix} = (-1)\begin{vmatrix} -1 & 0 \\ m & -1 \end{vmatrix} + 1 \cdot \begin{vmatrix} l & -1 \\ 0 & m \end{vmatrix} = -1 + lm$$

新组线性无关 $\iff$ 方程组只有零解 $\iff lm - 1 \ne 0$ ，即

$$lm \ne 1$$

### T2
反证。由 (I) 可由 (II) 表示，得 $r(\text{I}) \le r(\text{II})$ 。假设 $r(\text{II}) = r(\text{I}) = r$ ，取 (I) 的极大无关组 $\alpha_1, \cdots, \alpha_r$ 与 (II) 的极大无关组 $\beta_1, \cdots, \beta_r$ 。

$\alpha_1, \cdots, \alpha_r$ 可由 (II) 表示，从而可由 $\beta_1, \cdots, \beta_r$ 表示；又两组都含 $r$ 个线性无关向量且 $\alpha$ 组秩为 $r$ ，由"无关组添加表示向量"的定理， $\beta_1, \cdots, \beta_r$ 也可由 $\alpha_1, \cdots, \alpha_r$ 表示，于是两极大无关组**等价**。

(II) 中任一向量可由 $\beta_1, \cdots, \beta_r$ 表示，而 $\beta$ 组可由 $\alpha$ 组表示， $\alpha$ 组可由 (I) 表示，于是 (II) 整组可由 (I) 线性表示——与已知矛盾。故 $r(\text{II}) > r(\text{I})$ 。∎

（核心引理链：表示不增秩 + 等价向量组同秩 + "秩相等的无关组互相表示"。）