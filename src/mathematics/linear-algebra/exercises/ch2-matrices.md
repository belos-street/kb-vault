# 第 2 章练习：矩阵

> 配套 [doc/ch2-matrices.md](../doc/ch2-matrices.md)。难度分三档：B（基础）/ S（强化）/ T（真题级）；答案与解析统一在本文件末尾。

## 一、基础巩固（B1-B4，限时 5-8 分钟/题）

**B1（填空）**：设 $A = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}$ ，则 $A^2 - 5A + 6E =$＿＿＿。

**B2（选择）**：设 $A$ 、 $B$ 均为 $n$ 阶方阵，下列命题正确的是（　）。

(1) $AB = O \Rightarrow |A| = 0$ 或 $|B| = 0$ ；(2) $AB = O \Rightarrow A = O$ 或 $B = O$ ；(3) $(A + B)(A - B) = A^2 - B^2 \iff AB = BA$ ；(4) $A^2 = A \Rightarrow A = O$ 或 $A = E$ 。

A. (1)(2)　　B. (1)(3)　　C. (1)(4)　　D. (2)(3)

**B3（解答）**：用初等行变换法求 $A = \begin{pmatrix} 1 & 1 & 1 \\ 0 & 1 & 1 \\ 0 & 0 & 1 \end{pmatrix}$ 的逆矩阵。

**B4（解答，限时 8-12 分钟）**：设 $A = \begin{pmatrix} 1 & 0 \\ 0 & 2 \end{pmatrix}$ ， $B = \begin{pmatrix} 3 & 0 \\ 1 & 3 \end{pmatrix}$ ， $C = \begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$ ， $M = \begin{pmatrix} A & O \\ C & B \end{pmatrix}$ 。求 $|M|$ 与 $M^{-1}$ 。

## 二、强化提升（S1-S4，限时 10-15 分钟/题）

**S1（解答）**：设 $A$ 、 $B$ 均为 $n$ 阶方阵，满足 $AB = A + B$ 。证明 $A - E$ 与 $B - E$ 都可逆，且互为逆矩阵。

**S2（解答）**：设 $A$ 为 $n$ 阶矩阵， $r(A) = n - 1$ ，讨论 $r\big((A^*)^*\big)$ 的值。

**S3（解答）**：设 $A$ 为 3 阶可逆矩阵。先把 $A$ 的第 2 列加到第 1 列得 $B$ ，再把 $B$ 的第 1、2 行交换得 $C$ 。用初等矩阵表示 $C$ ，并用 $A$ 与初等矩阵表示 $C^{-1}$ ，说明 $C^{-1}$ 对应哪些初等变换。

**S4（解答）**：设 $A = \begin{pmatrix} 1 & 1 & 0 & 0 \\ 0 & 1 & 0 & 0 \\ 0 & 0 & 2 & 0 \\ 0 & 0 & 0 & 3 \end{pmatrix}$ ，求 $A^n$ 。

## 三、真题级（T1-T2，限时 15-25 分钟/题）

**T1（证明）**：设 $A$ 为 $n$ 阶矩阵， $A^2 = E$ 。证明： $r(A - E) + r(A + E) = n$ 。

**T2（解答）**：设 $A = \begin{pmatrix} 1 & 0 & -1 \\ 0 & 2 & 0 \\ -1 & 0 & 1 \end{pmatrix}$ ，解矩阵方程 $(A - E)X = A$ 。

---

## 答案与解析

### B1
直接计算： $A^2 = \begin{pmatrix} 7 & 10 \\ 15 & 22 \end{pmatrix}$ ， $5A = \begin{pmatrix} 5 & 10 \\ 15 & 20 \end{pmatrix}$ ，故

$$A^2 - 5A + 6E = \begin{pmatrix} 2 & 0 \\ 0 & 2 \end{pmatrix} + 6E = 8E$$

（背景： $A$ 的特征多项式为 $\lambda^2 - 5\lambda - 2$ （迹为 $5$ ，行列式为 $-2$ ）。由哈密顿-凯莱定理得 $A^2 - 5A - 2E = O$ ，即 $A^2 - 5A = 2E$ ，故 $A^2 - 5A + 6E = 2E + 6E = 8E$ 。数值验算：直接乘法 $A^2 = \begin{pmatrix} 7 & 10 \\ 15 & 22 \end{pmatrix}$ ， $A^2 - 5A = \begin{pmatrix} 2 & 0 \\ 0 & 2 \end{pmatrix} = 2E$ ，与定理结论一致。数二不要求定理本身，但"多项式代入化简"的手法要会。）

### B2
- (1) 对： $AB = O \Rightarrow |AB| = |A||B| = 0$ ；
- (2) 错：矩阵乘法无零因子，反例 $\begin{pmatrix} 1 & 0 \\ 0 & 0 \end{pmatrix}\begin{pmatrix} 0 & 0 \\ 0 & 1 \end{pmatrix} = O$ ；
- (3) 对：展开 $(A+B)(A-B) = A^2 - AB + BA - B^2$ ，等于 $A^2 - B^2 \iff AB = BA$ ；
- (4) 错：幂等矩阵不必是 $O$ 或 $E$ ，反例 $\mathrm{diag}(1, 0)$ 。

选 **B**。

### B3
构造 $(A \mid E)$ 只作行变换：

$$(A \mid E) = \left(\begin{array}{ccc|ccc} 1 & 1 & 1 & 1 & 0 & 0 \\ 0 & 1 & 1 & 0 & 1 & 0 \\ 0 & 0 & 1 & 0 & 0 & 1 \end{array}\right) \xrightarrow{r_2 - r_3} \left(\begin{array}{ccc|ccc} 1 & 1 & 1 & 1 & 0 & 0 \\ 0 & 1 & 0 & 0 & 1 & -1 \\ 0 & 0 & 1 & 0 & 0 & 1 \end{array}\right) \xrightarrow[r_1 - r_3]{r_1 - r_2} \left(\begin{array}{ccc|ccc} 1 & 0 & 0 & 1 & -1 & 0 \\ 0 & 1 & 0 & 0 & 1 & -1 \\ 0 & 0 & 1 & 0 & 0 & 1 \end{array}\right)$$

$$A^{-1} = \begin{pmatrix} 1 & -1 & 0 \\ 0 & 1 & -1 \\ 0 & 0 & 1 \end{pmatrix}$$

验算：直接乘回验证， $AA^{-1} = \begin{pmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 1 \end{pmatrix} = E$ ✓。

### B4
分块行列式： $|M| = |A| \cdot |B| = 2 \times 9 = 18$ 。

分块求逆（"左上可逆、右下可逆"型）： $A^{-1} = \mathrm{diag}\left(1, \dfrac{1}{2}\right)$ ， $B^{-1} = \dfrac{1}{9}\begin{pmatrix} 3 & 0 \\ -1 & 3 \end{pmatrix}$ 。套公式

$$M^{-1} = \begin{pmatrix} A^{-1} & O \\ -B^{-1}CA^{-1} & B^{-1} \end{pmatrix}$$

逐块计算： $B^{-1}C = \dfrac{1}{9}\begin{pmatrix} 3 & 3 \\ -1 & 2 \end{pmatrix} = \begin{pmatrix} \frac{1}{3} & \frac{1}{3} \\ -\frac{1}{9} & \frac{2}{9} \end{pmatrix}$ ，再右乘 $A^{-1}$ （第 2 列减半）： $B^{-1}CA^{-1} = \begin{pmatrix} \frac{1}{3} & \frac{1}{6} \\ -\frac{1}{9} & \frac{1}{9} \end{pmatrix}$ 。故

$$M^{-1} = \begin{pmatrix} 1 & 0 & 0 & 0 \\ 0 & \frac{1}{2} & 0 & 0 \\ -\frac{1}{3} & -\frac{1}{6} & \frac{1}{3} & 0 \\ \frac{1}{9} & -\frac{1}{9} & -\frac{1}{9} & \frac{1}{3} \end{pmatrix}$$

验算：用最终数字矩阵回代验证 $MM^{-1} = E$ （行 $\times$ 列）。左下 $2 \times 2$ 块： $M$ 第 3 行 $(1, 1, 3, 0)$ 乘 $M^{-1}$ 第 1 列 $\left(1, 0, -\frac{1}{3}, \frac{1}{9}\right)^{T}$ 得 $1 - 1 = 0$ ，乘第 2 列 $\left(0, \frac{1}{2}, -\frac{1}{6}, -\frac{1}{9}\right)^{T}$ 得 $\frac{1}{2} - \frac{1}{2} = 0$ ； $M$ 第 4 行 $(0, 1, 1, 3)$ 乘第 1 列得 $-\frac{1}{3} + \frac{1}{3} = 0$ ，乘第 2 列得 $\frac{1}{2} - \frac{1}{6} - \frac{1}{3} = 0$ ，即左下块为 $O$ ✓。再核 $(4,3)$ 元： $(0, 1, 1, 3) \cdot \left(0, 0, \frac{1}{3}, -\frac{1}{9}\right)^{T} = \frac{1}{3} - \frac{1}{3} = 0$ （若第 4 行第 3 列误写为 $0$ ，此元将为 $\frac{1}{3} \ne 0$ ）； $(4,4)$ 元： $3 \times \frac{1}{3} = 1$ ，均与 $E$ 相符 ✓。

### S1
移项凑因子： $AB - A - B = O$ ，两边加 $E$ ：

$$AB - A - B + E = E \implies (A - E)(B - E) = E$$

取行列式得 $|A - E| \cdot |B - E| = 1 \ne 0$ ，故 $A - E$ 、 $B - E$ 都可逆，且由 $XY = E$ 知 $X^{-1} = Y$ ：

$$(A - E)^{-1} = B - E, \qquad (B - E)^{-1} = A - E$$

（口诀复用："移项 → 因式分解（看清左右）→ 凑出数量矩阵"。）

### S2
由 $r(A^*)$ 三种情形： $r(A) = n - 1 \Rightarrow r(A^*) = 1$ 。再对 $A^*$ 用一次：

- $n = 2$ 时： $r(A^*) = 1 = n - 1$ ，故 $r\big((A^*)^*\big) = 1$ ；（也可直接用 $(A^*)^* = |A|^{n-2}A = A$ ， $r = 1$ 一致。）
- $n \ge 3$ 时： $(A^*)^* = |A|^{n-2}A$ ，而 $r(A) = n - 1 < n \Rightarrow |A| = 0$ ，故 $(A^*)^* = O$ ， $r\big((A^*)^*\big) = 0$ 。

数值特例： $n = 3$ 取 $A = \mathrm{diag}(1, 1, 0)$ ，则 $A^* = \mathrm{diag}(0, 0, 1)$ ， $(A^*)^* = O$ ，与结论一致。

结论： $n = 2$ 时为 $1$ ， $n \ge 3$ 时为 $0$ 。

### S3
"第 2 列加到第 1 列"是**列变换 → 右乘**： $Q = \begin{pmatrix} 1 & 0 & 0 \\ 1 & 1 & 0 \\ 0 & 0 & 1 \end{pmatrix}$ ；"交换第 1、2 行"是**行变换 → 左乘**： $P = \begin{pmatrix} 0 & 1 & 0 \\ 1 & 0 & 0 \\ 0 & 0 & 1 \end{pmatrix}$ 。于是

$$C = PAQ \implies C^{-1} = Q^{-1}A^{-1}P^{-1}$$

其中 $P^{-1} = P$ （换行矩阵自逆）， $Q^{-1} = \begin{pmatrix} 1 & 0 & 0 \\ -1 & 1 & 0 \\ 0 & 0 & 1 \end{pmatrix}$ 。故

$$C^{-1} = \begin{pmatrix} 1 & 0 & 0 \\ -1 & 1 & 0 \\ 0 & 0 & 1 \end{pmatrix} A^{-1} \begin{pmatrix} 0 & 1 & 0 \\ 1 & 0 & 0 \\ 0 & 0 & 1 \end{pmatrix}$$

解读： $Q^{-1}$ 位于 $A^{-1}$ 左侧，对应**行变换**：对任意 $X$ ， $(Q^{-1}X)$ 的第 2 行 $= X$ 的第 2 行 $- X$ 的第 1 行，即 $r_2 \leftarrow r_2 - r_1$ ； $P$ 位于右侧，对应**列变换**： $XP$ 交换 $X$ 的第 1、2 列。故 $C^{-1}$ 对应的初等变换是：行变换 $r_2 \leftarrow r_2 - r_1$ 与交换第 1、2 列（行变换与列变换分别作用在行、列下标上，先后次序不影响结果）。

### S4
分块对角 $A = \mathrm{diag}(B, C)$ ， $B = \begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix} = E + N$ （ $N = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$ ， $N^2 = O$ ）， $C = \mathrm{diag}(2, 3)$ 。

- $B^n = (E + N)^n = E + nN$ （二项式 $k \ge 2$ 项全为 $O$ ，且 $E$ 与 $N$ 可交换）： $B^n = \begin{pmatrix} 1 & n \\ 0 & 1 \end{pmatrix}$ ；
- $C^n = \mathrm{diag}(2^n, 3^n)$ 。

故

$$A^n = \begin{pmatrix} 1 & n & 0 & 0 \\ 0 & 1 & 0 & 0 \\ 0 & 0 & 2^n & 0 \\ 0 & 0 & 0 & 3^n \end{pmatrix}$$

验算： $n = 2$ 时左上块 $= \begin{pmatrix} 1 & 2 \\ 0 & 1 \end{pmatrix}$ ，与直接相乘一致 ✓。

### T1
**上界**： $A^2 = E \Rightarrow (A - E)(A + E) = O$ ，由"$AB = O \Rightarrow r(A) + r(B) \le n$"得

$$r(A - E) + r(A + E) \le n$$

**下界**： $(A - E) - (A + E) = -2E$ ，由"$r(X + Y) \le r(X) + r(Y)$"得

$$n = r(-2E) = r\big[(A - E) - (A + E)\big] \le r(A - E) + r(A + E)$$

夹逼即得 $r(A - E) + r(A + E) = n$ 。

### T2
先判断可逆： $A - E = \begin{pmatrix} 0 & 0 & -1 \\ 0 & 1 & 0 \\ -1 & 0 & 0 \end{pmatrix}$ ，按第 2 行展开得 $|A - E| = 1 \times \begin{vmatrix} 0 & -1 \\ -1 & 0 \end{vmatrix} = -1 \ne 0$ ，可逆。

观察 $A - E$ 的列： $Me_1 = (0, 0, -1)^T$ ， $Me_2 = e_2$ ， $Me_3 = (-1, 0, 0)^T$ ，逐个反解得 $M^{-1}e_1 = -e_3$ ， $M^{-1}e_2 = e_2$ ， $M^{-1}e_3 = -e_1$ ，即 $M^{-1} = M$ （自逆， $M^2 = E$ ）。

于是

$$X = (A - E)^{-1}A = (A - E)A = A^2 - A$$

计算 $A^2$ ： $A^2 = \begin{pmatrix} 1+0+1 & 0 & -1+0-1 \\ 0 & 4 & 0 \\ -1+0+1 & 0 & 1+0+1 \end{pmatrix} = \begin{pmatrix} 2 & 0 & -2 \\ 0 & 4 & 0 \\ -2 & 0 & 2 \end{pmatrix} = 2A$ ，故

$$X = 2A - A = A = \begin{pmatrix} 1 & 0 & -1 \\ 0 & 2 & 0 \\ -1 & 0 & 1 \end{pmatrix}$$

验算： $(A - E)X = (A - E)A = A^2 - A = A$ ✓（本题的巧妙处： $(A-E)$ 恰好自逆， $X$ 还原为 $A$ 。）