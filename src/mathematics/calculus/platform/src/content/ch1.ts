import type { Block } from '../data/types.ts'

export const ch1Content: Record<string, Block[]> = {
  'ch1-1': [
    {
      kind: 'p',
      text: '极限研究的是「函数在一点附近的行为」，所以第一步必须把研究对象说清楚：什么是函数、什么是映射、函数有哪些可以反复利用的性质。本讲按视频的九个小节展开，先把语言统一，再进入计算。'
    },
    { kind: 'h2', text: '函数的概念' },
    {
      kind: 'note',
      tone: 'definition',
      title: '函数',
      text: '设 $D$ 是非空实数集，若对每个 $x \\in D$，按某个对应法则 $f$ 都有唯一确定的 $y$ 与之对应，则称 $f$ 是定义在 $D$ 上的函数，记作 $y=f(x)$。',
      tex: String.raw`y=f(x),\quad x\in D`
    },
    {
      kind: 'p',
      text: '**函数三要素**：定义域、对应法则、值域。判断两个函数是否相同，只看定义域和对应法则是否都相同——值域是由它们决定的，不独立。'
    },
    {
      kind: 'note',
      tone: 'warn',
      title: '易错点：定义域不同就不是同一个函数',
      text: '$f(x)=\\dfrac{x^2-1}{x-1}$ 与 $g(x)=x+1$ 的对应法则在 $x\\neq 1$ 时完全一致，但 $f$ 在 $x=1$ 处无定义，所以 $f\\neq g$。'
    },
    { kind: 'h2', text: '映射的概念' },
    {
      kind: 'note',
      tone: 'definition',
      title: '映射',
      text: '设 $X,Y$ 是两个非空集合，若存在法则 $f$，使 $X$ 中每个元素 $x$ 都有 $Y$ 中唯一确定的元素 $y$ 与之对应，则称 $f$ 是从 $X$ 到 $Y$ 的映射，记作 $f:X\\to Y$，$y=f(x)$。',
      tex: String.raw`f:X\to Y,\qquad y=f(x)`
    },
    {
      kind: 'p',
      text: '映射是函数的推广：函数要求 $X,Y$ 都是实数集，映射允许任意集合。 $X$ 叫定义域，$Y$ 叫陪域，$f(X)$ 叫值域（像集）。注意值域是陪域的子集，不要求相等。'
    },
    { kind: 'h2', text: '映射的分类' },
    {
      kind: 'table',
      head: ['类型', '条件', '直观记忆'],
      rows: [
        [
          '单射',
          '不同元素映到不同元素：$x_1\\neq x_2\\Rightarrow f(x_1)\\neq f(x_2)$',
          '不撞车'
        ],
        ['满射', '值域等于陪域：$f(X)=Y$', '全覆盖'],
        ['双射', '既单射又满射', '一一对应']
      ]
    },
    {
      kind: 'graph',
      demo: 'mapping',
      title: '映射的分类',
      hint: '切换单射 / 满射 / 双射，观察箭头是否撞车、是否覆盖陪域。'
    },
    { kind: 'h2', text: '逆映射' },
    {
      kind: 'p',
      text: '只有**双射**才有逆映射。因为要定义 $f^{-1}:Y\\to X$，必须保证每个 $y\\in Y$ 都恰好对应一个 $x$：满射保证 $y$ 有原像，单射保证原像唯一。'
    },
    {
      kind: 'note',
      tone: 'theorem',
      title: '逆映射的性质',
      text: '若 $f:X\\to Y$ 是双射，则 $f^{-1}:Y\\to X$ 也是双射，且',
      tex: String.raw`f^{-1}(f(x))=x,\quad f(f^{-1}(y))=y`
    },
    { kind: 'h2', text: '复合映射' },
    {
      kind: 'p',
      text: '设 $g:X\\to Y$，$f:Y\\to Z$，则复合映射 $f\\circ g:X\\to Z$ 定义为 $(f\\circ g)(x)=f(g(x))$。复合的关键限制是：**内层映射的值域必须落在外层映射的定义域内**。'
    },
    {
      kind: 'note',
      tone: 'tip',
      title: '考试里更常见的是复合函数',
      text: '分段函数的复合是高频易错点：先判断内层 $g(x)$ 落在哪一段，再代入外层对应表达式，最后把各段结果拼回去。'
    },
    { kind: 'h2', text: '几种常见的函数' },
    {
      kind: 'list',
      items: [
        '常数函数：$y=C$，图像是水平直线',
        '幂函数：$y=x^\\alpha$，定义域随 $\\alpha$ 变化，考试常考 $\\alpha=\\frac12,\\ -1,\\ 2$ 等',
        '指数函数：$y=a^x\\ (a>0,a\\neq1)$，值域 $(0,+\\infty)$',
        '对数函数：$y=\\log_a x$，与指数函数互为反函数',
        '三角函数：$\\sin x,\\ \\cos x,\\ \\tan x$ 等，注意周期性',
        '反三角函数：$\\arcsin x,\\ \\arccos x,\\ \\arctan x$，注意值域限制'
      ]
    },
    {
      kind: 'graph',
      demo: 'function-lab',
      title: '函数图像实验室',
      hint: '切换函数族并拖动参数，观察振幅、周期、增减速度如何改变图像。'
    },
    { kind: 'h2', text: '函数的四种特性' },
    { kind: 'h3', text: '1. 有界性' },
    {
      kind: 'p',
      text: '若存在 $M>0$，使对定义域内所有 $x$ 都有 $|f(x)|\\leq M$，则称 $f$ 有界。数列的「有界」是同一个定义，只是把 $x$ 换成 $n$。'
    },
    {
      kind: 'note',
      tone: 'tip',
      title: '有界性在极限里的用途',
      text: '**有界量 × 无穷小 = 无穷小**。例如 $\\lim_{x\\to0}x\\sin\\frac1x=0$，因为 $\\sin\\frac1x$ 有界，而 $x\\to0$。'
    },
    { kind: 'h3', text: '2. 单调性' },
    {
      kind: 'p',
      text: '若 $x_1<x_2$ 时总有 $f(x_1)<f(x_2)$，则 $f$ 严格单调递增；若总有 $f(x_1)>f(x_2)$，则严格单调递减。严格单调函数一定存在反函数。'
    },
    { kind: 'h3', text: '3. 奇偶性' },
    {
      kind: 'p',
      text: '定义域必须关于原点对称，才谈得上奇偶性。'
    },
    {
      kind: 'formula',
      tex: String.raw`f(-x)=f(x)\ \Rightarrow\ \text{偶函数(关于 }y\text{ 轴对称)}`
    },
    {
      kind: 'formula',
      tex: String.raw`f(-x)=-f(x)\ \Rightarrow\ \text{奇函数(关于原点对称)}`
    },
    {
      kind: 'list',
      items: [
        '奇 × 奇 = 偶，偶 × 偶 = 偶，奇 × 偶 = 奇',
        '奇函数在对称区间 $[-a,a]$ 上的定积分为 $0$',
        '偶函数在对称区间上的积分等于 $2\\int_0^a f(x)\\,dx$'
      ]
    },
    { kind: 'h3', text: '4. 周期性' },
    {
      kind: 'p',
      text: '若存在 $T>0$，使 $f(x+T)=f(x)$ 对定义域内所有 $x$ 成立，则 $f$ 以 $T$ 为周期。 $\\sin x$ 的周期是 $2\\pi$，$\\sin 2x$ 的周期是 $\\pi$；一般地 $\\sin(\\omega x)$ 的周期为 $\\dfrac{2\\pi}{|\\omega|}$。'
    },
    { kind: 'h2', text: '反函数与反三角函数' },
    {
      kind: 'p',
      text: '反函数的图像与原函数关于直线 $y=x$ 对称。求反函数的标准步骤：由 $y=f(x)$ 解出 $x$，再交换 $x,y$ 的记号，最后写出反函数的定义域（即原函数的值域）。'
    },
    {
      kind: 'graph',
      demo: 'inverse',
      title: '反函数与 $y=x$ 对称',
      hint: '切换 $y=x^3$ 与 $y=e^x$，观察原函数与反函数是否始终关于 $y=x$ 对称。'
    },
    {
      kind: 'table',
      head: ['函数', '定义域', '值域', '单调性'],
      rows: [
        [
          '$\\arcsin x$',
          '$[-1,1]$',
          '$\\left[-\\frac\\pi2,\\frac\\pi2\\right]$',
          '递增'
        ],
        ['$\\arccos x$', '$[-1,1]$', '$[0,\\pi]$', '递减'],
        [
          '$\\arctan x$',
          '$\\mathbb{R}$',
          '$\\left(-\\frac\\pi2,\\frac\\pi2\\right)$',
          '递增'
        ]
      ]
    },
    {
      kind: 'note',
      tone: 'warn',
      title: '反三角函数最容易错的地方',
      text: '$\\arcsin(\\sin x)$ 不一定等于 $x$。只有 $x\\in\\left[-\\frac\\pi2,\\frac\\pi2\\right]$ 时才能直接消去；否则要先利用周期性把角化到主值区间。'
    },
    { kind: 'h2', text: '初等函数' },
    {
      kind: 'p',
      text: '由**基本初等函数**（幂、指数、对数、三角、反三角）经过有限次四则运算和复合得到的函数，统称初等函数。分段函数一般不是初等函数，但每一段可以是初等函数。'
    },
    {
      kind: 'note',
      tone: 'theorem',
      title: '初等函数的连续性',
      text: '初等函数在其**定义区间**内连续。因此若 $x_0$ 属于定义区间（不是孤立点），求 $\\lim_{x\\to x_0}f(x)$ 可以直接代入 $f(x_0)$；极限的困难只出现在定义区间端点、无定义点或分段点。'
    }
  ],

  'ch1-2': [
    {
      kind: 'p',
      text: '数列是定义在正整数集上的函数：$a_n=f(n)$。研究数列极限，就是研究 $n$ 越来越大时 $a_n$ 是否稳定地靠近某个常数。'
    },
    { kind: 'h2', text: '从「无限接近」到 ε-N 语言' },
    {
      kind: 'note',
      tone: 'definition',
      title: '数列极限',
      text: '若对任意给定的 $\\varepsilon>0$，总存在正整数 $N$，当 $n>N$ 时都有 $|a_n-A|<\\varepsilon$，则称数列 $\\{a_n\\}$ 收敛于 $A$，记作 $\\lim_{n\\to\\infty}a_n=A$。',
      tex: String.raw`\forall \varepsilon>0,\ \exists N\in\mathbb{N}^+,\ n>N\Rightarrow |a_n-A|<\varepsilon`
    },
    {
      kind: 'p',
      text: '几何意义：以 $A$ 为中心、$\\varepsilon$ 为半径的邻域 $(A-\\varepsilon,A+\\varepsilon)$，数列从某一项之后全部落入其中。 $\\varepsilon$ 是任意小的，所以「无限接近」可以被精确量化。'
    },
    {
      kind: 'graph',
      demo: 'sequence',
      title: '收敛数列的几何直观',
      hint: '拖动 ε 滑块，观察从第几项开始所有点都落入绿色带内。'
    },
    { kind: 'h2', text: '收敛数列的性质' },
    {
      kind: 'table',
      head: ['性质', '结论', '典型用途'],
      rows: [
        ['唯一性', '若极限存在，则极限唯一', '反证法证明极限不存在'],
        ['有界性', '收敛数列一定有界', '判断数列无界 ⇒ 发散'],
        ['保号性', '若 $A>0$，则从某项起 $a_n>0$', '证明不等式、夹逼'],
        [
          '子数列',
          '收敛数列的任一子数列也收敛于同一极限',
          '找两个子列极限不同 ⇒ 发散'
        ]
      ]
    },
    {
      kind: 'note',
      tone: 'warn',
      title: '有界只是收敛的必要条件',
      text: '$a_n=(-1)^n$ 有界但不收敛；$a_n=n$ 无界当然发散。所以「有界」不能反推「收敛」。'
    },
    { kind: 'h2', text: '子数列的作用' },
    {
      kind: 'p',
      text: '若数列收敛于 $A$，则它的任意子数列都收敛于 $A$。逆否命题更有用：只要能找到两个子数列收敛到不同的值，原数列一定发散。例如 $(-1)^n$ 的奇数项趋于 $-1$，偶数项趋于 $1$，所以发散。'
    },
    { kind: 'h2', text: '数列极限的四则运算' },
    {
      kind: 'p',
      text: '若 $\\lim a_n=A$，$\\lim b_n=B$ 都存在，则 $\\lim(a_n\\pm b_n)=A\\pm B$，$\\lim(a_nb_n)=AB$，且当 $B\\neq0$ 时 $\\lim\\frac{a_n}{b_n}=\\frac AB$。**前提是每个极限都存在**，不能对不存在的极限强行拆项。'
    },
    {
      kind: 'example',
      title: '例：有理式数列的极限',
      problem: '求 $\\lim_{n\\to\\infty}\\dfrac{3n^2+2n}{n^2-1}$。',
      steps: [
        '分子分母同除以最高次幂 $n^2$：$\\dfrac{3+2/n}{1-1/n^2}$。',
        '由 $\\lim\\frac1n=0$、$\\lim\\frac1{n^2}=0$ 及四则运算，分子趋于 $3$，分母趋于 $1$。',
        '所以原极限等于 $\\dfrac31=3$。'
      ],
      answer: '$3$'
    },
    { kind: 'h2', text: '常用极限与「先猜后证」' },
    {
      kind: 'list',
      items: [
        '$\\lim_{n\\to\\infty}\\dfrac1{n^p}=0\\quad(p>0)$',
        '$\\lim_{n\\to\\infty}q^n=0\\quad(|q|<1)$',
        '$\\lim_{n\\to\\infty}\\sqrt[n]{n}=1$',
        '$\\lim_{n\\to\\infty}\\left(1+\\dfrac1n\\right)^n=e$（1.6 讲证明）'
      ]
    },
    {
      kind: 'example',
      title: '例：有理化求极限',
      problem: '求 $\\lim_{n\\to\\infty}\\left(\\sqrt{n+1}-\\sqrt n\\right)$。',
      steps: [
        '分子有理化：$\\sqrt{n+1}-\\sqrt n=\\dfrac{1}{\\sqrt{n+1}+\\sqrt n}$。',
        '分母趋于 $+\\infty$，所以分式趋于 $0$。'
      ],
      answer: '$0$'
    },
    {
      kind: 'note',
      tone: 'method',
      title: '先猜后证',
      text: '遇到递推数列 $a_{n+1}=f(a_n)$，先算出前几项猜出极限 $A$，再证明「有界 + 单调」，最后对递推式两边取极限解出 $A$。这套流程在 1.6 讲单调有界准则时完整展开。'
    }
  ],

  'ch1-3': [
    {
      kind: 'p',
      text: '数列极限只研究 $n\\to\\infty$ 的离散过程；函数极限要研究 $x$ 连续地趋近于某一点或无穷远。两种趋近方式对应两套定义，但思想完全一致。'
    },
    { kind: 'h2', text: '$x\\to x_0$ 时的函数极限' },
    {
      kind: 'note',
      tone: 'definition',
      title: '函数极限（有限点）',
      text: '设 $f$ 在 $x_0$ 的某去心邻域内有定义。若对任意 $\\varepsilon>0$，存在 $\\delta>0$，当 $0<|x-x_0|<\\delta$ 时都有 $|f(x)-A|<\\varepsilon$，则称 $x\\to x_0$ 时 $f(x)$ 的极限为 $A$。',
      tex: String.raw`\forall \varepsilon>0,\ \exists \delta>0,\ 0<|x-x_0|<\delta\Rightarrow |f(x)-A|<\varepsilon`
    },
    {
      kind: 'note',
      tone: 'warn',
      title: '为什么是「去心」邻域',
      text: '极限只关心 $x$ 趋近 $x_0$ 的过程，与 $f(x_0)$ 是否存在、等于多少无关。这正是后面「可去间断点」可以补定义的原因。'
    },
    { kind: 'h2', text: '$x\\to\\infty$ 时的函数极限' },
    {
      kind: 'note',
      tone: 'definition',
      title: '函数极限（无穷远）',
      text: '若对任意 $\\varepsilon>0$，存在 $X>0$，当 $|x|>X$ 时都有 $|f(x)-A|<\\varepsilon$，则称 $x\\to\\infty$ 时 $f(x)$ 的极限为 $A$。',
      tex: String.raw`\forall \varepsilon>0,\ \exists X>0,\ |x|>X\Rightarrow |f(x)-A|<\varepsilon`
    },
    {
      kind: 'graph',
      demo: 'limit',
      title: '极限的 ε-δ 直观',
      hint: '拖动 ε 滑块，观察函数曲线在 $x_0$ 附近是否整体落入 $A\\pm\\varepsilon$ 的带状区域。'
    },
    { kind: 'h2', text: '左极限与右极限' },
    {
      kind: 'p',
      text: '把 $0<|x-x_0|<\\delta$ 拆成两个方向，就得到左极限 $\\lim_{x\\to x_0^-}f(x)$ 与右极限 $\\lim_{x\\to x_0^+}f(x)$。'
    },
    {
      kind: 'formula',
      tex: String.raw`\lim_{x\to x_0}f(x)=A\iff \lim_{x\to x_0^-}f(x)=\lim_{x\to x_0^+}f(x)=A`
    },
    {
      kind: 'p',
      text: '这是判断分段函数在分界点处极限是否存在的标准方法：分别算左右极限，相等则极限存在，不等则极限不存在（但左右极限各自可以存在）。'
    },
    {
      kind: 'example',
      title: '例：分段函数在分界点的极限',
      problem:
        '设 $f(x)=\\begin{cases}x+1,&x<1\\\\ x^2,&x\\geq1\\end{cases}$，讨论 $x\\to1$ 时的极限。',
      steps: [
        '左极限：$\\lim_{x\\to1^-}f(x)=\\lim_{x\\to1^-}(x+1)=2$。',
        '右极限：$\\lim_{x\\to1^+}f(x)=\\lim_{x\\to1^+}x^2=1$。',
        '左右极限不相等，所以 $\\lim_{x\\to1}f(x)$ 不存在。'
      ],
      answer: '极限不存在（左极限 $2$，右极限 $1$）'
    },
    { kind: 'h2', text: '函数极限的性质' },
    {
      kind: 'list',
      items: [
        '唯一性：极限存在则唯一',
        '局部有界性：极限存在 ⇒ 在 $x_0$ 的某去心邻域内有界',
        '局部保号性：若 $A>0$，则在某去心邻域内 $f(x)>0$',
        '局部保序性：若在某去心邻域内 $f(x)\\geq0$，则 $A\\geq0$（等号不能省）'
      ]
    },
    {
      kind: 'note',
      tone: 'tip',
      title: '函数极限与数列极限的联系',
      text: '若 $\\lim_{x\\to x_0}f(x)=A$，则对任意以 $x_0$ 为极限且 $x_n\\neq x_0$ 的数列，都有 $\\lim f(x_n)=A$。这条性质常用来证明极限不存在：找两条趋近路径得到不同结果即可。'
    }
  ],

  'ch1-4': [
    {
      kind: 'p',
      text: '无穷小和无穷大描述的都不是「数的大小」，而是极限过程中的变化趋势。把这两个概念立住，后面等价无穷小替换才有落脚点。'
    },
    { kind: 'h2', text: '无穷小' },
    {
      kind: 'note',
      tone: 'definition',
      title: '无穷小',
      text: '若 $\\lim_{x\\to x_0}\\alpha(x)=0$，则称 $\\alpha(x)$ 是 $x\\to x_0$ 时的无穷小量。',
      tex: String.raw`\lim_{x\to x_0}\alpha(x)=0`
    },
    {
      kind: 'p',
      text: '$0$ 是唯一的常数无穷小。除此之外，无穷小都是变量：$x\\to0$ 时 $x$、$\\sin x$、$1-\\cos x$ 都是无穷小；但 $0.0001$ 是一个确定的数，不是无穷小。'
    },
    { kind: 'h2', text: '无穷大' },
    {
      kind: 'note',
      tone: 'definition',
      title: '无穷大',
      text: '若 $\\lim_{x\\to x_0}f(x)=\\infty$，则称 $f(x)$ 是 $x\\to x_0$ 时的无穷大量。这里的 $\\infty$ 表示绝对值无限增大，不是某个数。',
      tex: String.raw`\forall M>0,\ \exists \delta>0,\ 0<|x-x_0|<\delta\Rightarrow |f(x)|>M`
    },
    {
      kind: 'note',
      tone: 'warn',
      title: '无穷大 = 极限不存在',
      text: '$\\lim f(x)=\\infty$ 是一种**记法**，表示极限不存在但发散方式特殊。不能说「极限是无穷大」，因为极限存在要求极限是有限常数。'
    },
    { kind: 'h2', text: '无穷小与无穷大的关系' },
    {
      kind: 'formula',
      tex: String.raw`f(x)\ \text{是无穷大}\iff \frac{1}{f(x)}\ \text{是无穷小}\quad(f(x)\neq0)`
    },
    {
      kind: 'p',
      text: '在同一极限过程中，非零无穷小的倒数是无穷大，无穷大的倒数是无穷小。这条关系常用来把 $\\frac{\\infty}{\\infty}$ 型转化为 $\\frac00$ 型。'
    },
    { kind: 'h2', text: '无穷小的运算性质' },
    {
      kind: 'list',
      items: [
        '有限个无穷小的和仍是无穷小',
        '有限个无穷小的积仍是无穷小',
        '有界函数与无穷小的乘积是无穷小',
        '常数与无穷小的乘积是无穷小'
      ]
    },
    {
      kind: 'example',
      title: '例：有界量 × 无穷小',
      problem: '求 $\\lim_{x\\to0}x\\sin\\dfrac1x$。',
      steps: [
        '$|\\sin(1/x)|\\leq1$，所以 $\\sin(1/x)$ 有界。',
        '$x\\to0$，$x$ 是无穷小。',
        '有界量 × 无穷小 = 无穷小，所以极限为 $0$。'
      ],
      answer: '$0$'
    },
    {
      kind: 'note',
      tone: 'warn',
      title: '无限多个无穷小的和不一定为无穷小',
      text: '有限个无穷小的和一定是无穷小。但**无限多个**无穷小的和不一定：$\\underbrace{\\frac1n+\\cdots+\\frac1n}_{n\\text{ 项}}=1$，虽然每一项都趋于 $0$，和却趋于 $1$。'
    }
  ],

  'ch1-5': [
    {
      kind: 'p',
      text: '极限的四则运算法则是最常用的工具，但它有严格的使用前提。做极限题的第一步永远是：**先代入，判断类型**。'
    },
    { kind: 'h2', text: '四则运算法则' },
    {
      kind: 'formula',
      tex: String.raw`\lim [f(x)\pm g(x)]=A\pm B,\quad \lim [f(x)g(x)]=AB`
    },
    {
      kind: 'formula',
      tex: String.raw`\lim \frac{f(x)}{g(x)}=\frac AB\qquad(B\neq0)`
    },
    {
      kind: 'note',
      tone: 'warn',
      title: '使用前提',
      text: '拆开的前提是 $\\lim f(x)$ 与 $\\lim g(x)$ **都存在**。若其中一个不存在，不能把整个极限拆成两个不存在的极限相加减；$(\\infty)-(\\infty)$ 就是典型反例。'
    },
    { kind: 'h2', text: '复合函数的极限' },
    {
      kind: 'p',
      text: '若 $\\lim_{x\\to x_0}g(x)=u_0$，且 $f(u)$ 在 $u_0$ 处连续，则'
    },
    {
      kind: 'formula',
      tex: String.raw`\lim_{x\to x_0}f(g(x))=f\left(\lim_{x\to x_0}g(x)\right)=f(u_0)`
    },
    {
      kind: 'p',
      text: '这就是「连续函数可以把极限号穿进去」的依据。如果外层函数不连续，就不能直接穿，需要先判断内层极限落在哪个定义区间。'
    },
    { kind: 'h2', text: '多项式与有理函数的极限' },
    {
      kind: 'table',
      head: ['情形（$x\\to\\infty$）', '处理方法', '结果'],
      rows: [
        ['分子次数 < 分母次数', '分子分母同除最高次幂', '极限为 $0$'],
        ['分子次数 = 分母次数', '同除最高次幂', '极限为首项系数之比'],
        ['分子次数 > 分母次数', '同除最高次幂', '极限为 $\\infty$（发散）']
      ]
    },
    {
      kind: 'example',
      title: '例：有理函数在无穷远的极限',
      problem: '求 $\\lim_{x\\to\\infty}\\dfrac{2x^2+1}{3x^2-x}$。',
      steps: [
        '分子分母同除以 $x^2$：$\\dfrac{2+1/x^2}{3-1/x}$。',
        '由 $\\lim\\frac1x=0$，分子趋于 $2$，分母趋于 $3$。',
        '所以极限为 $\\dfrac23$。'
      ],
      answer: '$\\dfrac23$'
    },
    { kind: 'h2', text: '$\\frac00$ 与 $\\frac\\infty\\infty$ 的初步处理' },
    {
      kind: 'list',
      items: [
        '因式分解，约去公因子（如 $\\frac{x^2-1}{x-1}$）',
        '分子有理化（含根号差）',
        '通分（分式差）',
        '等价无穷小替换（1.7 讲系统讲）',
        '洛必达法则（3.2 讲系统讲）'
      ]
    },
    {
      kind: 'example',
      title: '例：有理化处理 $\\frac00$ 型',
      problem: '求 $\\lim_{x\\to0}\\dfrac{\\sqrt{x+1}-1}{x}$。',
      steps: [
        '分子有理化：$\\dfrac{(\\sqrt{x+1}-1)(\\sqrt{x+1}+1)}{x(\\sqrt{x+1}+1)}=\\dfrac{x}{x(\\sqrt{x+1}+1)}$。',
        '约去 $x$：$\\dfrac{1}{\\sqrt{x+1}+1}$。',
        '代入 $x=0$：$\\dfrac{1}{1+1}=\\dfrac12$。'
      ],
      answer: '$\\dfrac12$'
    },
    {
      kind: 'note',
      tone: 'method',
      title: '做题顺序',
      text: '先代入 → 得到确定值就直接写答案；得到 $\\frac00$ 或 $\\frac\\infty\\infty$ 再选方法；得到 $\\infty-\\infty$、$0\\cdot\\infty$、$1^\\infty$ 等未定式，先变形归入前两类。'
    }
  ],

  'ch1-6': [
    {
      kind: 'p',
      text: '有些极限无法用四则运算直接算，需要先证明存在，再求值。夹逼准则和单调有界准则就是两把「存在性」钥匙；两个重要极限则给出了两个最常用的极限值。'
    },
    { kind: 'h2', text: '夹逼准则' },
    {
      kind: 'note',
      tone: 'theorem',
      title: '夹逼准则',
      text: '若在 $x_0$ 的某去心邻域内（或 $n>N$ 时）有 $g(x)\\leq f(x)\\leq h(x)$，且 $\\lim g(x)=\\lim h(x)=A$，则 $\\lim f(x)=A$。',
      tex: String.raw`g(x)\le f(x)\le h(x),\quad \lim g=\lim h=A\ \Rightarrow\ \lim f=A`
    },
    {
      kind: 'example',
      title: '例：$n$ 项和的夹逼',
      problem:
        '求 $\\lim_{n\\to\\infty}\\left(\\dfrac1{n^2}+\\dfrac2{n^2}+\\cdots+\\dfrac n{n^2}\\right)$。',
      steps: [
        '和式等于 $\\dfrac{1+2+\\cdots+n}{n^2}=\\dfrac{n(n+1)}{2n^2}=\\dfrac{n+1}{2n}$。',
        '直接化简后取极限：$\\lim\\dfrac{n+1}{2n}=\\dfrac12$。'
      ],
      answer: '$\\dfrac12$'
    },
    {
      kind: 'note',
      tone: 'method',
      title: '夹逼题的放缩套路',
      text: '和式放缩通常「分母统一放大 / 缩小」：把每项分母换成最大或最小，得到上下界；再让上下界都趋于同一个值。'
    },
    { kind: 'h2', text: '单调有界准则' },
    {
      kind: 'note',
      tone: 'theorem',
      title: '单调有界准则',
      text: '单调递增且有上界的数列必收敛；单调递减且有下界的数列必收敛。',
      tex: String.raw`a_n\uparrow\ \text{且有上界}\ \Rightarrow\ \{a_n\}\ \text{收敛}`
    },
    {
      kind: 'note',
      tone: 'method',
      title: '递推数列的证明流程',
      text: '① 计算前几项猜出极限 $A$；② 用数学归纳法证明有界（$a_n<A$ 或 $a_n>A$）；③ 作差或作商证明单调；④ 由准则得极限存在，再对递推式两边取极限解出 $A$。'
    },
    { kind: 'h2', text: '第一个重要极限' },
    {
      kind: 'formula',
      tex: String.raw`\lim_{x\to0}\frac{\sin x}{x}=1`
    },
    {
      kind: 'p',
      text: '本质是 $x\\to0$ 时 $\\sin x\\sim x$。推广形式：若 $\\lim\\varphi(x)=0$，则 $\\lim\\dfrac{\\sin\\varphi(x)}{\\varphi(x)}=1$。'
    },
    {
      kind: 'example',
      title: '例：凑出重要极限',
      problem: '求 $\\lim_{x\\to0}\\dfrac{\\sin3x}{\\sin5x}$。',
      steps: [
        '拆成 $\\dfrac{\\sin3x}{3x}\\cdot\\dfrac{5x}{\\sin5x}\\cdot\\dfrac{3x}{5x}$。',
        '前两个因子都趋于 $1$，第三个因子为 $\\dfrac35$。',
        '所以极限为 $\\dfrac35$。'
      ],
      answer: '$\\dfrac35$'
    },
    { kind: 'h2', text: '第二个重要极限' },
    {
      kind: 'formula',
      tex: String.raw`\lim_{x\to\infty}\left(1+\frac1x\right)^x=e`
    },
    {
      kind: 'p',
      text: '令 $t=\\dfrac1x$，得到等价形式 $\\lim_{t\\to0}(1+t)^{1/t}=e$。推广：若 $\\lim\\varphi(x)=0$，则 $\\lim[1+\\varphi(x)]^{1/\\varphi(x)}=e$。'
    },
    {
      kind: 'note',
      tone: 'method',
      title: '$1^\\infty$ 型万能公式',
      text: '若 $\\lim\\varphi(x)=0$，$\\lim\\psi(x)=\\infty$，且 $\\lim\\varphi(x)\\psi(x)=A$，则 $\\lim[1+\\varphi(x)]^{\\psi(x)}=e^A$。',
      tex: String.raw`\lim [1+\varphi(x)]^{\psi(x)}=e^{\lim \varphi(x)\psi(x)}`
    },
    {
      kind: 'example',
      title: '例：$1^\\infty$ 型',
      problem: '求 $\\lim_{x\\to\\infty}\\left(\\dfrac{x+1}{x-1}\\right)^x$。',
      steps: [
        '改写底数：$\\dfrac{x+1}{x-1}=1+\\dfrac{2}{x-1}$，属于 $1^\\infty$ 型。',
        '计算 $\\varphi\\psi=\\dfrac{2}{x-1}\\cdot x\\to2$。',
        '所以极限为 $e^2$。'
      ],
      answer: '$e^2$'
    }
  ],

  'ch1-7': [
    {
      kind: 'p',
      text: '无穷小的比较，是把「都趋于零」的多个量按趋零速度排序。等价无穷小替换是求极限的第一选择，但必须遵守「乘除可换、加减慎换」。'
    },
    { kind: 'h2', text: '四个等级' },
    {
      kind: 'table',
      head: ['$\\lim\\frac{\\alpha}{\\beta}$', '关系', '记号'],
      rows: [
        ['$0$', '$\\alpha$ 是 $\\beta$ 的高阶无穷小', '$\\alpha=o(\\beta)$'],
        ['$\\infty$', '$\\alpha$ 是 $\\beta$ 的低阶无穷小', '—'],
        ['$c\\neq0$', '$\\alpha$ 与 $\\beta$ 同阶', '$\\alpha=O(\\beta)$'],
        ['$1$', '$\\alpha$ 与 $\\beta$ 等价', '$\\alpha\\sim\\beta$']
      ]
    },
    {
      kind: 'graph',
      demo: 'infinitesimal',
      title: '谁趋于零更快',
      hint: '在 $x\\to0$ 附近比较 $x$、$x^2$、$\\sin x$：$x^2$ 明显更快贴近 $0$。'
    },
    { kind: 'h2', text: '等价无穷小替换定理' },
    {
      kind: 'note',
      tone: 'theorem',
      title: '替换定理',
      text: "设 $\\alpha\\sim\\alpha'$，$\\beta\\sim\\beta'$，且 $\\lim\\dfrac{\\alpha'}{\\beta'}$ 存在，则 $\\lim\\dfrac{\\alpha}{\\beta}=\\lim\\dfrac{\\alpha'}{\\beta'}$。",
      tex: String.raw`\alpha\sim\alpha',\ \beta\sim\beta'\ \Rightarrow\ \lim\frac{\alpha}{\beta}=\lim\frac{\alpha'}{\beta'}`
    },
    {
      kind: 'note',
      tone: 'warn',
      title: '乘除可换，加减慎换',
      text: '在乘积或商中，因子可以放心替换；在加减中，如果替换后主部相互抵消，就会丢失高阶项，导致错误。此时应改用泰勒展开保留更高阶。'
    },
    {
      kind: 'example',
      title: '反例：加减替换的陷阱',
      problem: '求 $\\lim_{x\\to0}\\dfrac{\\tan x-\\sin x}{x^3}$。',
      steps: [
        '若把 $\\tan x$ 与 $\\sin x$ 都替换成 $x$，分子变成 $0$，会误判为 $0$。',
        '正确做法：$\\tan x-\\sin x=\\tan x(1-\\cos x)\\sim x\\cdot\\dfrac{x^2}{2}=\\dfrac{x^3}{2}$。',
        '所以极限为 $\\dfrac12$，不是 $0$。'
      ],
      answer: '$\\dfrac12$'
    },
    { kind: 'h2', text: '常用等价无穷小表（$x\\to0$）' },
    {
      kind: 'table',
      head: ['等价关系', '等价关系'],
      rows: [
        ['$\\sin x\\sim x$', '$\\tan x\\sim x$'],
        ['$\\arcsin x\\sim x$', '$\\arctan x\\sim x$'],
        ['$\\ln(1+x)\\sim x$', '$e^x-1\\sim x$'],
        ['$a^x-1\\sim x\\ln a$', '$(1+x)^\\alpha-1\\sim\\alpha x$'],
        ['$1-\\cos x\\sim\\dfrac{x^2}{2}$', '$x-\\sin x\\sim\\dfrac{x^3}{6}$']
      ]
    },
    {
      kind: 'note',
      tone: 'tip',
      title: '替换的优先级',
      text: '先看能不能等价替换（最快）；替换后仍是未定式，再考虑洛必达或泰勒。等价替换和洛必达可以组合使用，但每一步都要满足各自的前提。'
    }
  ],

  'ch1-8': [
    {
      kind: 'p',
      text: '连续是「极限等于函数值」。它把极限计算和函数值直接接上，也是后面闭区间性质、导数、积分全部成立的前提。'
    },
    { kind: 'h2', text: '连续的定义' },
    {
      kind: 'note',
      tone: 'definition',
      title: '函数在一点连续',
      text: '设 $f$ 在 $x_0$ 的某邻域内有定义，若 $\\lim_{x\\to x_0}f(x)=f(x_0)$，则称 $f$ 在 $x_0$ 处连续。',
      tex: String.raw`\lim_{x\to x_0}f(x)=f(x_0)`
    },
    {
      kind: 'p',
      text: '这个等式实际上包含三件事：$f(x_0)$ 有定义、$\\lim_{x\\to x_0}f(x)$ 存在、两者相等。缺一不可。'
    },
    {
      kind: 'formula',
      tex: String.raw`\lim_{\Delta x\to0}\Delta y=0,\qquad \Delta y=f(x_0+\Delta x)-f(x_0)`
    },
    { kind: 'h2', text: '左连续与右连续' },
    {
      kind: 'p',
      text: '若 $\\lim_{x\\to x_0^-}f(x)=f(x_0)$，称 $f$ 在 $x_0$ 左连续；若 $\\lim_{x\\to x_0^+}f(x)=f(x_0)$，称右连续。 $f$ 在 $x_0$ 连续 $\\iff$ 既左连续又右连续。'
    },
    { kind: 'h2', text: '间断点的四种类型' },
    {
      kind: 'table',
      head: ['类型', '特征', '典型例子'],
      rows: [
        [
          '可去间断点',
          '左右极限存在且相等，但不等于函数值（或函数无定义）',
          '$\\frac{\\sin x}{x}$ 在 $x=0$'
        ],
        ['跳跃间断点', '左右极限都存在但不相等', '符号函数在 $x=0$'],
        ['无穷间断点', '至少一侧极限为 $\\infty$', '$\\frac1x$ 在 $x=0$'],
        [
          '振荡间断点',
          '函数值在有限范围内反复振荡，极限不存在',
          '$\\sin\\frac1x$ 在 $x=0$'
        ]
      ]
    },
    {
      kind: 'note',
      tone: 'info',
      title: '第一类与第二类间断点',
      text: '先按「左右极限是否存在」分层：左右极限都存在的属于**第一类**（可去、跳跃）；至少一侧极限不存在的属于**第二类**（无穷、振荡）。'
    },
    {
      kind: 'graph',
      demo: 'continuity',
      title: '四类间断点',
      hint: '切换类型，观察分界点附近左右极限与函数值的差异。'
    },
    { kind: 'h2', text: '分段函数在分界点的连续性' },
    {
      kind: 'p',
      text: '固定流程：① 算左极限；② 算右极限；③ 看函数值。三个量相等才连续；左右极限相等但不等于函数值 ⇒ 可去间断点；左右极限不等 ⇒ 跳跃间断点。'
    },
    {
      kind: 'example',
      title: '例：求参数使函数连续',
      problem:
        '设 $f(x)=\\begin{cases}\\dfrac{\\sin ax}{x},&x\\neq0\\\\ 2,&x=0\\end{cases}$ 在 $x=0$ 处连续，求 $a$。',
      steps: [
        '当 $x\\neq0$ 时，$\\lim_{x\\to0}\\dfrac{\\sin ax}{x}=a$（用 $\\sin ax\\sim ax$）。',
        '连续要求极限等于函数值：$a=f(0)=2$。'
      ],
      answer: '$a=2$'
    },
    { kind: 'h2', text: '连续函数的运算' },
    {
      kind: 'list',
      items: [
        '连续函数的和、差、积、商（分母不为零）仍连续',
        '连续函数的复合仍连续',
        '严格单调连续函数的反函数也连续'
      ]
    },
    {
      kind: 'note',
      tone: 'theorem',
      title: '初等函数的连续性',
      text: '初等函数在其定义区间内连续。因此求初等函数在定义域内点的极限，直接代入即可；只有定义域边界、无定义点和分段点需要单独讨论。'
    }
  ],

  'ch1-9': [
    {
      kind: 'p',
      text: '闭区间上的连续函数，把「连续」这个局部性质升级成了整体性质：一定有最值、一定有界、能取到中间值。这是证明题最常用的三件套。'
    },
    { kind: 'h2', text: '最值定理与有界性定理' },
    {
      kind: 'note',
      tone: 'theorem',
      title: '最值定理',
      text: '若 $f$ 在闭区间 $[a,b]$ 上连续，则 $f$ 在 $[a,b]$ 上必取得最大值 $M$ 和最小值 $m$。',
      tex: String.raw`f\in C[a,b]\ \Rightarrow\ \exists \xi,\eta\in[a,b],\ f(\xi)=M,\ f(\eta)=m`
    },
    {
      kind: 'note',
      tone: 'theorem',
      title: '有界性定理',
      text: '闭区间上的连续函数一定有界。注意两个条件都不能少：开区间连续可能无界（$1/x$ 在 $(0,1)$），闭区间但不连续也可能无界（$1/x$ 在 $[-1,1]$ 挖去 $0$）。'
    },
    { kind: 'h2', text: '零点定理' },
    {
      kind: 'note',
      tone: 'theorem',
      title: '零点定理',
      text: '若 $f$ 在 $[a,b]$ 上连续，且 $f(a)\\cdot f(b)<0$，则存在 $\\xi\\in(a,b)$，使 $f(\\xi)=0$。',
      tex: String.raw`f(a)f(b)<0\ \Rightarrow\ \exists \xi\in(a,b),\ f(\xi)=0`
    },
    {
      kind: 'p',
      text: "零点定理只保证「存在」，不保证唯一。若要证明唯一，需要再用单调性：$f'$ 恒正或恒负。"
    },
    { kind: 'h2', text: '介值定理' },
    {
      kind: 'note',
      tone: 'theorem',
      title: '介值定理',
      text: '若 $f$ 在 $[a,b]$ 上连续，$m$、$M$ 分别为最小值与最大值，则对任意 $C\\in[m,M]$，存在 $\\xi\\in[a,b]$，使 $f(\\xi)=C$。',
      tex: String.raw`m\le C\le M\ \Rightarrow\ \exists \xi\in[a,b],\ f(\xi)=C`
    },
    {
      kind: 'p',
      text: '零点定理是介值定理的特殊情形（$C=0$）。做题时通常先构造辅助函数 $F(x)$，再验证 $F(a)$ 与 $F(b)$ 异号，最后用零点定理。'
    },
    {
      kind: 'graph',
      demo: 'ivt',
      title: '介值定理的几何直观',
      hint: '拖动水平线 $y=C$，只要它夹在最小值和最大值之间，就一定能与曲线相交。'
    },
    {
      kind: 'example',
      title: '例：证明方程有根',
      problem: '证明方程 $x^3-3x+1=0$ 在区间 $(0,1)$ 内至少有一个实根。',
      steps: [
        '令 $f(x)=x^3-3x+1$，它是多项式，在 $[0,1]$ 上连续。',
        '计算端点：$f(0)=1>0$，$f(1)=1-3+1=-1<0$。',
        '由零点定理，存在 $\\xi\\in(0,1)$ 使 $f(\\xi)=0$，即方程在 $(0,1)$ 内至少有一个实根。'
      ],
      answer: '零点定理得证'
    },
    {
      kind: 'note',
      tone: 'method',
      title: '闭区间证明题模板',
      text: "① 构造 $F(x)$（把待证等式移项成 $F(x)=0$）；② 说明 $F$ 在闭区间连续；③ 算端点值证明异号；④ 用零点定理得存在性；⑤ 若要唯一性，再证 $F'$ 定号。"
    },
    {
      kind: 'exercise',
      title: '第一章综合练习',
      items: [
        {
          id: 'ch1-9-e1',
          level: '易错',
          question: '求 $\\lim\\limits_{x\\to0}\\dfrac{\\tan x-x}{x^3}$。',
          answer: '$\\dfrac13$',
          solution:
            '$\\tan x=x+\\dfrac{x^3}{3}+o(x^3)$，所以 $\\tan x-x\\sim\\dfrac{x^3}{3}$，极限为 $\\dfrac13$。这是加减相消场景，不能直接用 $\\tan x\\sim x$ 替换。'
        },
        {
          id: 'ch1-9-e2',
          level: '考研',
          question:
            '求 $\\lim\\limits_{n\\to\\infty}\\left(\\dfrac{1}{n^2+1}+\\dfrac{2}{n^2+2}+\\cdots+\\dfrac{n}{n^2+n}\\right)$。',
          answer: '$\\dfrac12$',
          solution:
            '分子为 $1+2+\\cdots+n=\\dfrac{n(n+1)}2$。分母介于 $n^2+1$ 与 $n^2+n$ 之间，上下界都趋于 $\\dfrac12$，由夹逼准则得极限为 $\\dfrac12$。'
        },
        {
          id: 'ch1-9-e3',
          level: '基础',
          question: '讨论 $f(x)=\\dfrac{\\sin x}{x}$ 在 $x=0$ 处的间断点类型。',
          answer: '可去间断点',
          solution:
            '$\\lim\\limits_{x\\to0}\\dfrac{\\sin x}{x}=1$ 存在，但 $f(0)$ 无定义；补充定义 $f(0)=1$ 后连续，因此是第一类中的可去间断点。'
        },
        {
          id: 'ch1-9-e4',
          level: '基础',
          question:
            '证明方程 $x-\\cos x=0$ 在 $\\left(0,\\dfrac{\\pi}{2}\\right)$ 内至少有一个实根。',
          answer: '至少存在一个实根',
          solution:
            '令 $f(x)=x-\\cos x$，在 $\\left[0,\\dfrac{\\pi}{2}\\right]$ 上连续；$f(0)=-1<0$，$f\\left(\\dfrac{\\pi}{2}\\right)=\\dfrac{\\pi}{2}>0$，由零点定理，存在 $\\xi\\in\\left(0,\\dfrac{\\pi}{2}\\right)$ 使 $f(\\xi)=0$。'
        }
      ]
    }
  ]
}
