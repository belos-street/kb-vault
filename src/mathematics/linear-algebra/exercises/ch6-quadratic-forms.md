# 第 6 章练习：二次型

> 配套 [doc/ch6-quadratic-forms.md](../doc/ch6-quadratic-forms.md)。难度分三档：B（基础）/ S（强化）/ T（真题级）；答案与解析统一在本文件末尾。

## 一、基础巩固（B1-B4，限时 5-8 分钟/题）

**B1（解答）**：写出二次型 $f(x_1, x_2, x_3) = x_1^2 + 2x_2^2 + 5x_3^2 + 2x_1x_2 - 2x_1x_3 + 4x_2x_3$ 的矩阵 $A$ ，并求该二次型的秩。

**B2（解答）**：用配方法化 $f(x_1, x_2, x_3) = x_1^2 + 2x_2^2 + x_3^2 + 2x_1x_2 + 2x_1x_3$ 为标准形，写出所作的可逆线性变换，并求 $p$ 、 $q$ 。

**B3（解答）**：用正交变换法化 $f(x_1, x_2, x_3) = x_1^2 + x_2^2 + x_3^2 + 2x_1x_2$ 为标准形，写出正交矩阵 $Q$ 与 $r, p, q$ 。

**B4（选择）**：下列二次型中正定的是（　）。

A. $f = x_1^2 + x_2^2 - 2x_1x_2$

B. $f = 2x_1^2 + 3x_2^2 + 3x_3^2 + 4x_2x_3$

C. $f = x_1^2 + x_2^2 + x_3^2 - 2x_1x_2 - 2x_1x_3 + 2x_2x_3$

D. $f = x_1^2 + x_2^2 + x_3^2 + 2x_1x_2 + 2x_1x_3 + 2x_2x_3$

## 二、强化提升（S1-S4，限时 10-15 分钟/题）

**S1（解答）**：求参数 $t$ 的取值范围，使 $f(x_1, x_2, x_3) = x_1^2 + 4x_2^2 + 4x_3^2 + 2tx_1x_2$ 为正定二次型；并讨论 $t$ 取何值时 $f$ 半正定。

**S2（证明）**：设 $A$ 、 $B$ 均为 $n$ 阶正定矩阵。证明： $A + B$ 正定；并对 $k > 0$ 证明 $kA$ 正定。

**S3（选择）**：与 $A = \mathrm{diag}(1, 2, 3)$ **合同**的矩阵是（　）。

A. $\mathrm{diag}(1, 2, -3)$　　B. $\mathrm{diag}(2, 4, 6)$　　C. $\mathrm{diag}(-1, -2, -3)$　　D. $\mathrm{diag}(1, 1, 0)$

**S4（解答）**：用正交变换法化 $f(x_1, x_2, x_3) = x_1^2 + 2x_2^2 + 2x_3^2 + 4x_2x_3$ 为标准形，写出规范形与 $r, p, q$ 。

## 三、真题级（T1-T2，限时 15-25 分钟/题）

**T1（解答，真题改编）**：已知二次型 $f(x_1, x_2, x_3) = 2x_1^2 - x_2^2 + ax_3^2 + 2x_1x_2 - 8x_1x_3 + 2x_2x_3$ 经正交变换 $x = Qy$ 化为标准形 $\lambda_1 y_1^2 + \lambda_2 y_2^2$ ，且 $\lambda_1 = 6$ ， $\lambda_2 = -3$ 。

(1) 求常数 $a$ 与 $\lambda_3$ ；(2) 求正交矩阵 $Q$ 与标准形；(3) 判断 $f$ 是否正定，说明理由。

**T2（证明）**：设 $A$ 为 $n$ 阶实对称矩阵。证明： $A$ 正定 $\iff$ 存在 $n$ 阶可逆矩阵 $C$ ，使 $A = C^TC$ 。

---

## 答案与解析

### B1
平方项系数进主对角线，交叉项系数除以 $2$ 放对称位置： $2x_1x_2 \Rightarrow a_{12} = a_{21} = 1$ ； $-2x_1x_3 \Rightarrow a_{13} = a_{31} = -1$ ； $4x_2x_3 \Rightarrow a_{23} = a_{32} = 2$ ：

$$A = \begin{pmatrix} 1 & 1 & -1 \\ 1 & 2 & 2 \\ -1 & 2 & 5 \end{pmatrix}$$

顺序主子式： $\Delta_1 = 1 \ne 0$ ， $\Delta_2 = 2 - 1 = 1 \ne 0$ ， $\Delta_3 = |A| = 1(10 - 4) - 1(5 + 2) + (-1)(2 + 2) = 6 - 7 - 4 = -5 \ne 0$ ，故

$$r(f) = r(A) = 3$$

### B2
集中含 $x_1$ 的项配方：

$$x_1^2 + 2x_1x_2 + 2x_1x_3 = (x_1 + x_2 + x_3)^2 - (x_2 + x_3)^2$$

$$f = (x_1 + x_2 + x_3)^2 - (x_2^2 + 2x_2x_3 + x_3^2) + 2x_2^2 + x_3^2 = (x_1 + x_2 + x_3)^2 + x_2^2 - 2x_2x_3$$

$$= (x_1 + x_2 + x_3)^2 + (x_2 - x_3)^2 - x_3^2$$

令 $y_1 = x_1 + x_2 + x_3$ ， $y_2 = x_2 - x_3$ ， $y_3 = x_3$ ，反解 $x_1 = y_1 - y_2 - 2y_3$ ， $x_2 = y_2 + y_3$ ， $x_3 = y_3$ ，变换矩阵

$$C = \begin{pmatrix} 1 & -1 & -2 \\ 0 & 1 & 1 \\ 0 & 0 & 1 \end{pmatrix}, \qquad |C| = 1 \ne 0$$ ✓

标准形 $f = y_1^2 + y_2^2 - y_3^2$ ， $p = 2$ ， $q = 1$ 。

### B3
$$A = \begin{pmatrix} 1 & 1 & 0 \\ 1 & 1 & 0 \\ 0 & 0 & 1 \end{pmatrix}, \qquad |\lambda E - A| = \lambda(\lambda - 1)(\lambda - 2)$$

特征值 $2, 1, 0$ 。

- $\lambda = 2$ ： $\xi_1 = (1, 1, 0)^T$ ； $\lambda = 1$ ： $\xi_2 = (0, 0, 1)^T$ ； $\lambda = 0$ ： $\xi_3 = (1, -1, 0)^T$ （两两正交 ✓）。

$$Q = \begin{pmatrix} \frac{1}{\sqrt{2}} & 0 & \frac{1}{\sqrt{2}} \\ \frac{1}{\sqrt{2}} & 0 & -\frac{1}{\sqrt{2}} \\ 0 & 1 & 0 \end{pmatrix}, \qquad f = 2y_1^2 + y_2^2$$

$r = 2$ （非零特征值个数）， $p = 2$ ， $q = 0$ 。

### B4
- A： $f = (x_1 - x_2)^2$ ， $p = 1 < 2$ ，不正定；
- B： $A = \begin{pmatrix} 2 & 0 & 0 \\ 0 & 3 & 2 \\ 0 & 2 & 3 \end{pmatrix}$ ， $\Delta_1 = 2$ ， $\Delta_2 = \begin{vmatrix} 2 & 0 \\ 0 & 3 \end{vmatrix} = 6$ ， $\Delta_3 = 2(9 - 4) = 10$ 全正，**正定** ✓；
- C： $f = (x_1 - x_2 - x_3)^2$ ， $p = 1$ ，不正定；
- D： $f = (x_1 + x_2 + x_3)^2$ ， $p = 1$ ，不正定。

选 **B**。

### S1
$$A = \begin{pmatrix} 1 & t & 0 \\ t & 4 & 0 \\ 0 & 0 & 4 \end{pmatrix}$$

$$\Delta_1 = 1 > 0, \qquad \Delta_2 = 4 - t^2 > 0 \iff -2 < t < 2, \qquad \Delta_3 = 4(4 - t^2) > 0$$

$\Delta_3$ 与 $\Delta_2$ 同解，取交集，**正定**范围为：

$$-2 < t < 2$$

**半正定**：配方 $f = (x_1 + tx_2)^2 + (4 - t^2)x_2^2 + 4x_3^2$ ，按 $|t|$ 与 $2$ 的大小分三类：

- $t = 2$ ： $f = (x_1 + 2x_2)^2 + 4x_3^2 \ge 0$ 恒成立，取 $x = (-2, 1, 0)^T \ne 0$ 得 $f = 0$ ，故 $f$ **半正定**（不正定）；
- $t = -2$ ： $f = (x_1 - 2x_2)^2 + 4x_3^2 \ge 0$ 恒成立，取 $x = (2, 1, 0)^T \ne 0$ 得 $f = 0$ ，半正定；
- $|t| > 2$ ： $4 - t^2 < 0$ ，取 $x_1 = -tx_2$ 、 $x_3 = 0$ 、 $x_2 \ne 0$ 得 $f = (4 - t^2)x_2^2 < 0$ ， $f$ 可负，不半正定。

特征值路径复核： $A$ 的特征值为 $4$ 与 $\dfrac{5 \pm \sqrt{9 + 4t^2}}{2}$ ， $t = \pm 2$ 时为 $4, 5, 0$ ，全非负且含 $0$ ，半正定 ✓ ，与配方路径一致。

结论： $-2 < t < 2$ 正定； $t = \pm 2$ 半正定； $|t| > 2$ 不定。

### S2
**$A + B$ 正定**：对称性 $(A + B)^T = A^T + B^T = A + B$ ✓；对任意 $x \ne 0$ ：

$$x^T(A + B)x = x^TAx + x^TBx > 0 + 0 > 0$$

（ $A$ 、 $B$ 各自正定， $x \ne 0$ 时两项都严格为正。）由定义法， $A + B$ 正定。∎

**$kA$ 正定**（ $k > 0$ ）：对称性显然； $x \ne 0$ 时 $x^T(kA)x = k \cdot x^TAx > 0$ （正数乘正数）。∎

### S3
合同的充要条件是正负惯性指数相同。 $A = \mathrm{diag}(1, 2, 3)$ 的 $p = 3$ ， $q = 0$ 。

- A： $p = 2, q = 1$ ✗；B： $\mathrm{diag}(2, 4, 6)$ 的 $p = 3, q = 0$ ✓ （取 $C = \mathrm{diag}\left(\sqrt{2}, \sqrt{2}, \sqrt{2}\right)$ ，一般地第 $i$ 个对角元取 $\sqrt{b_i/a_i}$ ；复算： $C^TAC = \mathrm{diag}\left(\sqrt{2}, \sqrt{2}, \sqrt{2}\right)\,\mathrm{diag}(1, 2, 3)\,\mathrm{diag}\left(\sqrt{2}, \sqrt{2}, \sqrt{2}\right) = \mathrm{diag}(2, 4, 6)$ ✓）；C： $p = 0$ ✗；D： $p = 2, q = 0$ ✗。

选 **B**。（注意 B 与 $A$ **不相似**——迹不同 $12 \ne 6$ ："合同不蕴含相似"的活例子。）

### S4
**方法选择**： $A$ 是块对角阵 $\mathrm{diag}\left(1, \begin{pmatrix} 2 & 2 \\ 2 & 2 \end{pmatrix}\right)$ ： $1 \times 1$ 块直接给出特征值 $1$ ；右块行和相等（均为 $4$ ），给出特征向量 $(0, 1, 1)^T$ 与特征值 $4$ ；又右块秩为 $1$ ，另一特征值为 $0$ ——块结构观察可秒出全部特征值，这是本题综合于 B3 之上的一层，特征多项式展开仅作复核：

$$A = \begin{pmatrix} 1 & 0 & 0 \\ 0 & 2 & 2 \\ 0 & 2 & 2 \end{pmatrix}, \qquad |\lambda E - A| = (\lambda - 1)\left[(\lambda - 2)^2 - 4\right] = \lambda(\lambda - 1)(\lambda - 4)$$

特征值 $1, 4, 0$ 。

- $\lambda = 1$ ： $\xi_1 = (1, 0, 0)^T$ ； $\lambda = 4$ ： $\xi_2 = (0, 1, 1)^T$ ； $\lambda = 0$ ： $\xi_3 = (0, 1, -1)^T$ （两两正交 ✓）。

$$Q = \begin{pmatrix} 1 & 0 & 0 \\ 0 & \frac{1}{\sqrt{2}} & \frac{1}{\sqrt{2}} \\ 0 & \frac{1}{\sqrt{2}} & -\frac{1}{\sqrt{2}} \end{pmatrix}, \qquad f = y_1^2 + 4y_2^2$$

规范形（正系数调成 $1$ ，零项舍去）： $f = z_1^2 + z_2^2$ ， $r = 2$ ， $p = 2$ ， $q = 0$ 。

### T1
**(1)** 写矩阵并利用标准形系数 = 特征值（不计顺序）：

$$A = \begin{pmatrix} 2 & 1 & -4 \\ 1 & -1 & 1 \\ -4 & 1 & a \end{pmatrix}, \qquad \{\lambda_1, \lambda_2, \lambda_3\} = \{6, -3, \lambda_3\}$$

**迹定关系**： $6 + (-3) + \lambda_3 = \operatorname{tr}(A) = 1 + a$ ，得 $\lambda_3 = a - 2$ 。

**行列式定 $a$**：按第一行展开

$$|A| = 2(-a - 1) - (a + 4) + (-4)(-3) = -2a - 2 - a - 4 + 12 = 6 - 3a$$

而 $|A| = 6 \times (-3) \times \lambda_3 = -18(a - 2)$ ，联立：

$$6 - 3a = -18(a - 2) \implies 15a = 30 \implies a = 2, \qquad \lambda_3 = 0$$

**复核**： $|6E - A| = \begin{vmatrix} 4 & -1 & 4 \\ -1 & 7 & -1 \\ 4 & -1 & 4 \end{vmatrix} = 0$ （第 1、3 行相同）✓； $|-3E - A| = \begin{vmatrix} -5 & -1 & 4 \\ -1 & -2 & -1 \\ 4 & -1 & -5 \end{vmatrix} = -5 \times 9 + 9 + 4 \times 9 = 0$ ✓；迹 $2 - 1 + 2 = 3 = 6 - 3 + 0$ ✓； $|A| = 6 - 3 \times 2 = 0 = 6 \times (-3) \times 0$ ✓。
**(2)** 求特征向量：

- $\lambda = 6$ ： $(6E - A)x = 0$ 化简得 $x_1 = -x_3$ ， $x_2 = 0$ ， $\xi_1 = (1, 0, -1)^T$ ；
- $\lambda = -3$ ： $(-3E - A)x = 0$ 化简得 $x_1 = x_3$ ， $x_2 = -x_3$ ， $\xi_2 = (1, -1, 1)^T$ ；
- $\lambda = 0$ ： $Ax = 0$ 得 $x_1 = x_3$ ， $x_2 = 2x_3$ ， $\xi_3 = (1, 2, 1)^T$ 。

两两正交（逐对验内积为 $0$ ✓），单位化：

$$Q = \begin{pmatrix} \frac{1}{\sqrt{2}} & \frac{1}{\sqrt{3}} & \frac{1}{\sqrt{6}} \\ 0 & -\frac{1}{\sqrt{3}} & \frac{2}{\sqrt{6}} \\ -\frac{1}{\sqrt{2}} & \frac{1}{\sqrt{3}} & \frac{1}{\sqrt{6}} \end{pmatrix}, \qquad f = 6y_1^2 - 3y_2^2$$

**(3)** 不正定：特征值含 $-3 < 0$ （或 $p = 1 < 3$ ，或 $|A| = 0$ 违反必要条件）。

### T2
**（ $\Leftarrow$）** 设 $A = C^TC$ ， $C$ 可逆。对称性： $A^T = C^TC = A$ ✓。对任意 $x \ne 0$ ：由 $C$ 可逆知 $Cx \ne 0$ ，故

$$x^TAx = x^TC^TCx = (Cx)^T(Cx) = \|Cx\|^2 > 0$$

由定义法， $A$ 正定。

**（ $\Rightarrow$）** 设 $A$ 正定，则 $A$ 实对称且特征值 $\lambda_1, \cdots, \lambda_n > 0$ 。存在正交矩阵 $Q$ 使

$$Q^TAQ = \Lambda = \mathrm{diag}(\lambda_1, \cdots, \lambda_n)$$

令 $D = \mathrm{diag}\left(\sqrt{\lambda_1}, \cdots, \sqrt{\lambda_n}\right)$ （可逆，对角元全正），则 $\Lambda = D^TD$ ，于是

$$A = Q\Lambda Q^T = QD^TDQ^T = (DQ^T)^T(DQ^T) = C^TC, \qquad C = DQ^T$$

$C$ 可逆（ $|C| = |D| \cdot |Q^T| = |D| \cdot |Q| \ne 0$ ）。∎

（正定性的"定义法"与"分解法"在这条充要链里各用一次，是抽象证明题的标准双面写法。）