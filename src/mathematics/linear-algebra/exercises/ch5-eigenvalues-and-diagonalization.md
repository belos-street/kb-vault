# 第 5 章练习：特征值与特征向量

> 配套 [doc/ch5-eigenvalues-and-diagonalization.md](../doc/ch5-eigenvalues-and-diagonalization.md)。难度分三档：B（基础）/ S（强化）/ T（真题级）；答案与解析统一在本文件末尾。

## 一、基础巩固（B1-B4，限时 5-8 分钟/题）

**B1（解答）**：设 $A = \begin{pmatrix} 0 & 0 & 1 \\ 0 & 1 & 0 \\ 1 & 0 & 0 \end{pmatrix}$ ，求 $A$ 的全部特征值与特征向量，并判断 $A$ 能否相似对角化。

**B2（填空）**：设 3 阶矩阵 $A$ 的特征值为 $1, 2, 3$ ，则 $\left|2A^{-1} + E\right| =$＿＿＿。

**B3（解答）**：设 $\xi = (1, 1, 1)^T$ 是矩阵 $A = \begin{pmatrix} 2 & 1 & 1 \\ a & 2 & 1 \\ 1 & 1 & b \end{pmatrix}$ 的特征向量，求 $a$ 、 $b$ 及对应的特征值。

**B4（解答）**：判断 $A = \begin{pmatrix} 2 & 1 & 0 \\ 0 & 2 & 0 \\ 0 & 0 & 3 \end{pmatrix}$ 能否相似对角化，说明理由。

## 二、强化提升（S1-S4，限时 10-15 分钟/题）

**S1（解答）**：设 3 阶矩阵 $A$ 的特征值为 $1, -1, 2$ ，求 $\left|A^2 - 2A + E\right|$ 与 $\operatorname{tr}\big((A - E)^2\big)$ 。

**S2（解答）**：设 $A = \begin{pmatrix} 4 & 0 & 0 \\ 0 & 3 & a \\ 0 & a & 3 \end{pmatrix}$ （ $a > 0$ ），已知 $\lambda = 2$ 是 $A$ 的特征值。求 $a$ ，并求可逆矩阵 $P$ 使 $P^{-1}AP$ 为对角阵。

**S3（解答）**：判断 $A = \begin{pmatrix} 1 & 1 & 0 \\ 0 & 2 & 1 \\ 0 & 0 & 3 \end{pmatrix}$ 与 $B = \mathrm{diag}(1, 2, 3)$ 是否相似，说明理由。

**S4（解答）**：设 $A = \begin{pmatrix} 0 & 1 \\ -2 & 3 \end{pmatrix}$ ，求 $A^n$ 。

## 三、真题级（T1-T2，限时 15-25 分钟/题）

**T1（解答）**：设 $A = \begin{pmatrix} 2 & 2 & -2 \\ 2 & 5 & -4 \\ -2 & -4 & 5 \end{pmatrix}$ ，求正交矩阵 $Q$ ，使 $Q^TAQ$ 为对角阵。

**T2（解答）**：设 3 阶实对称矩阵 $A$ 的特征值为 $3, 0, 0$ ，且 $\xi = (1, 1, 1)^T$ 是属于特征值 $3$ 的特征向量。求矩阵 $A$ 。

---

## 答案与解析

### B1
特征多项式按第 2 行（或第 2 列）展开：

$$|\lambda E - A| = \begin{vmatrix} \lambda & 0 & -1 \\ 0 & \lambda - 1 & 0 \\ -1 & 0 & \lambda \end{vmatrix} = (\lambda - 1)(\lambda^2 - 1) = (\lambda - 1)^2(\lambda + 1)$$

特征值 $\lambda_1 = \lambda_2 = 1$ （二重）， $\lambda_3 = -1$ 。

- $\lambda = 1$ ： $(E - A)x = 0$ 即 $-x_1 + x_3 = 0$ ，基础解系 $\xi_1 = (1, 0, 1)^T$ ；
- $\lambda = -1$ ： $(-E - A)x = 0$ 即 $x_1 + x_3 = 0$ 且 $x_2 = 0$ ，基础解系 $\xi_2 = (1, 0, -1)^T$ 。

重根 $\lambda = 1$ 满足 $3 - r(E - A) = 2 = k$ ，且 $A$ 是实对称矩阵（必可正交对角化），故 $A$ **可对角化**： $P = (\xi_1, \xi_2, e_2)$ 随意补一个无关列即可， $\Lambda = \mathrm{diag}(1, -1, 1)$ （列与对角元对应）。

验算： $A\xi_1 = (1, 0, 1)^T = \xi_1$ ✓， $A\xi_2 = (−1, 0, −1)^T = −\xi_2$ ✓。

### B2
$2A^{-1} + E$ 的特征值为 $\dfrac{2}{\lambda_i} + 1$ ，即 $3, 2, \dfrac{5}{3}$ ，故

$$\left|2A^{-1} + E\right| = 3 \times 2 \times \frac{5}{3} = 10$$

（注意 $A^{-1}$ 公式要求 $A$ 可逆： $|A| = 1 \times 2 \times 3 = 6 \ne 0$ ✓。）

### B3
由 $A\xi = \lambda\xi$ ：

$$A\xi = (4,\ a + 3,\ b + 2)^T = \lambda(1, 1, 1)^T$$

比较分量： $\lambda = 4$ ， $a + 3 = 4 \Rightarrow a = 1$ ， $b + 2 = 4 \Rightarrow b = 2$ 。

验算： $a = 1$ 、 $b = 2$ 时各行元素之和均为 $4$ ，与"行和相等 $\Rightarrow (1,1,1)^T$ 是对应 $\lambda = 4$ 的特征向量"的高频结构吻合 ✓。

### B4
$A$ 是上三角矩阵，特征值为对角元 $\lambda_1 = \lambda_2 = 2$ （二重）， $\lambda_3 = 3$ 。检查二重根：

$$2E - A = \begin{pmatrix} 0 & -1 & 0 \\ 0 & 0 & 0 \\ 0 & 0 & -1 \end{pmatrix}, \qquad r(2E - A) = 2, \quad n - r(2E - A) = 1 < 2 = k$$

二重根只提供 $1$ 个线性无关特征向量，全矩阵只有 $2$ 个 $< n = 3$ ，故 $A$ **不能**相似对角化。（教训：见到重根不能直接下结论，必须数 $n - r(\lambda E - A)$ 。）

### S1
矩阵多项式的特征值 = 特征值代入多项式。 $B = A^2 - 2A + E = (A - E)^2$ 的特征值为 $(\lambda_i - 1)^2$ ：

$$0, \quad 4, \quad 1$$

- $|B| = 0 \times 4 \times 1 = 0$ （特征值含 $0$ ， $B$ 不可逆）；
- $\operatorname{tr}(B) = 0 + 4 + 1 = 5$ 。

### S2
特征多项式 $\left|\lambda E - A\right| = (\lambda - 4)\left[(\lambda - 3)^2 - a^2\right]$ 。 $\lambda = 2$ 是特征值： $(2 - 3)^2 - a^2 = 0 \Rightarrow a^2 = 1$ ，由 $a > 0$ 得 $a = 1$ 。此时特征值为 $4, 4, 2$ 。

- $\lambda = 4$ （二重）： $(4E - A)x = 0$ 给出 $x_2 = x_3$ ，基础解系 $\xi_1 = (1, 0, 0)^T$ ， $\xi_2 = (0, 1, 1)^T$ ；
- $\lambda = 2$ ： $(2E - A)x = 0$ 给出 $x_1 = 0$ ， $x_2 = -x_3$ ，基础解系 $\xi_3 = (0, 1, -1)^T$ 。

$$P = \begin{pmatrix} 1 & 0 & 0 \\ 0 & 1 & 1 \\ 0 & 1 & -1 \end{pmatrix}, \qquad P^{-1}AP = \mathrm{diag}(4, 4, 2)$$

验算： $A(1,1,1)^T$ 型行和检查不适用（非对称行和结构），直接代： $A\xi_2 = (0, 4, 4)^T = 4\xi_2$ ✓， $A\xi_3 = (0, 2, -2)^T = 2\xi_3$ ✓。

### S3
$A$ 是上三角矩阵，特征值为对角元 $1, 2, 3$ ，**互异**，故 $A$ 可对角化，且存在 $P$ 使 $P^{-1}AP = \mathrm{diag}(1, 2, 3) = B$ 。

$$A \sim B$$

（相似的定义不要求求出 $P$ ：只要说明"都可对角化 + 特征值相同"。也可用传递性： $A \sim \Lambda$ 且 $B = \Lambda$ 。）

### S4
特征方程 $\lambda^2 - 3\lambda + 2 = 0$ （二阶直接用 $\lambda^2 - \operatorname{tr}(A)\lambda + |A|$ ），得 $\lambda_1 = 1$ ， $\lambda_2 = 2$ 。

- $\lambda = 1$ ： $(E - A)x = 0$ 给 $x_1 = x_2$ ， $\xi_1 = (1, 1)^T$ ；
- $\lambda = 2$ ： $(2E - A)x = 0$ 给 $2x_1 = x_2$ ， $\xi_2 = (1, 2)^T$ 。

$P = \begin{pmatrix} 1 & 1 \\ 1 & 2 \end{pmatrix}$ ， $P^{-1} = \begin{pmatrix} 2 & -1 \\ -1 & 1 \end{pmatrix}$ ，

$$A^n = P\begin{pmatrix} 1 & 0 \\ 0 & 2^n \end{pmatrix}P^{-1} = \begin{pmatrix} 2 - 2^n & 2^n - 1 \\ 2 - 2^{n+1} & 2^{n+1} - 1 \end{pmatrix}$$

验算： $n = 1$ 得 $\begin{pmatrix} 0 & 1 \\ -2 & 3 \end{pmatrix} = A$ ✓； $n = 2$ 得 $\begin{pmatrix} -2 & 3 \\ -6 & 7 \end{pmatrix}$ ，与 $A^2$ 直接相乘一致 ✓。

### T1
特征多项式（把第 2、3 行加到第 1 行，第 1 行变为 $(\lambda - 1)(1, 1, 1)$ 提出后消元）：

$$|\lambda E - A| = (\lambda - 1)^2(\lambda - 10)$$

（自检： $\operatorname{tr}(A) = 12 = 1 + 1 + 10$ ✓， $|A| = 10 = 1 \times 1 \times 10$ ✓。）

**求特征向量**：

- $\lambda = 1$ ： $(A - E)x = 0$ 只剩方程 $x_1 + 2x_2 - 2x_3 = 0$ ，基础解系 $\xi_1 = (-2, 1, 0)^T$ ， $\xi_2 = (2, 0, 1)^T$ 。内积 $= -4 \ne 0$ ，**必须施密特**：

$$\beta_2 = \xi_2 - \frac{\xi_2^T\xi_1}{\xi_1^T\xi_1}\xi_1 = (2, 0, 1)^T - \frac{-4}{5}(-2, 1, 0)^T = \left(\frac{2}{5}, \frac{4}{5}, 1\right)^T \xrightarrow{\text{取整}} (2, 4, 5)^T$$

- $\lambda = 10$ ： $(A - 10E)x = 0$ 给出 $x_2 = 2x_1$ ， $x_3 = -2x_1$ ， $\xi_3 = (1, 2, -2)^T$ （与 $\xi_1$ 、 $\beta_2$ 自动正交 ✓）。

**全部单位化**：

$$\eta_1 = \frac{1}{\sqrt{5}}(-2, 1, 0)^T, \qquad \eta_2 = \frac{1}{3\sqrt{5}}(2, 4, 5)^T, \qquad \eta_3 = \frac{1}{3}(1, 2, -2)^T$$

$$Q = \begin{pmatrix} -\frac{2}{\sqrt{5}} & \frac{2}{3\sqrt{5}} & \frac{1}{3} \\ \frac{1}{\sqrt{5}} & \frac{4}{3\sqrt{5}} & \frac{2}{3} \\ 0 & \frac{5}{3\sqrt{5}} & -\frac{2}{3} \end{pmatrix}, \qquad Q^TAQ = \begin{pmatrix} 1 & & \\ & 1 & \\ & & 10 \end{pmatrix}$$

验算： $A(2, 4, 5)^T = (2, 4, 5)^T$ ✓（ $\lambda = 1$ ）， $A(1, 2, -2)^T = (10, 20, -20)^T = 10(1, 2, -2)^T$ ✓。

### T2
实对称矩阵不同特征值的特征向量相互正交，故属于 $\lambda = 0$ 的特征子空间是 $\xi$ 的正交补平面 $x_1 + x_2 + x_3 = 0$ 。

取正交矩阵 $Q = (\eta_1, \eta_2, \eta_3)$ ， $\eta_1 = \dfrac{1}{\sqrt{3}}(1, 1, 1)^T$ ， $\eta_2, \eta_3$ 为该平面内任一组标准正交向量，则

$$A = Q\Lambda Q^T = 3\,\eta_1\eta_1^T + 0 \cdot \eta_2\eta_2^T + 0 \cdot \eta_3\eta_3^T = 3 \cdot \frac{1}{3}\begin{pmatrix} 1 & 1 & 1 \\ 1 & 1 & 1 \\ 1 & 1 & 1 \end{pmatrix} = \begin{pmatrix} 1 & 1 & 1 \\ 1 & 1 & 1 \\ 1 & 1 & 1 \end{pmatrix}$$

后两项为零与 $\eta_2, \eta_3$ 的具体取法无关，故 $A$ 唯一确定：

$$A = \begin{pmatrix} 1 & 1 & 1 \\ 1 & 1 & 1 \\ 1 & 1 & 1 \end{pmatrix}$$

验算： $A\xi = 3\xi$ ✓（每行和为 $3$ ）； $Ax = 0$ 对一切 $x_1 + x_2 + x_3 = 0$ 成立 ✓， $r(A) = 1$ 恰有二重零特征值。