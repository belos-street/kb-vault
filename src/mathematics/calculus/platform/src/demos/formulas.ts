// demo 公式与文案的纯数据层：不依赖 React / Mafs，供视图与校验脚本共用。
export type FunctionFamily = 'sine' | 'quad' | 'exp'

export const functionLabFamilies: Record<
  FunctionFamily,
  {
    label: string
    formula: (a: number, b: number) => string
    f: (x: number, a: number, b: number) => number
    a: [number, number, number]
    b: [number, number, number]
    aLabel: string
    bLabel: string
  }
> = {
  sine: {
    label: '$y=a\\sin(bx)$',
    formula: (a, b) => String.raw`y=${a.toFixed(1)}\sin(${b.toFixed(1)}x)`,
    f: (x, a, b) => a * Math.sin(b * x),
    a: [0.5, 1, 3],
    b: [0.5, 1, 4],
    aLabel: '振幅 a',
    bLabel: '角频率 b'
  },
  quad: {
    label: '$y=ax^2+b$',
    formula: (a, b) =>
      String.raw`y=${a.toFixed(1)}x^2${b >= 0 ? '+' : ''}${b.toFixed(1)}`,
    f: (x, a, b) => a * x * x + b,
    a: [-2, 1, 2],
    b: [-3, 0, 3],
    aLabel: '开口 a',
    bLabel: '截距 b'
  },
  exp: {
    label: '$y=ae^{bx}$',
    formula: (a, b) => String.raw`y=${a.toFixed(1)}e^{${b.toFixed(1)}x}`,
    f: (x, a, b) => a * Math.exp(b * x),
    a: [0.2, 1, 2],
    b: [-1, 1, 1],
    aLabel: '系数 a',
    bLabel: '指数 b'
  }
}

export const inverseTitle = '反函数与 $y=x$ 对称'
export const inverseHint = '原函数与反函数的图像关于直线 $y=x$ 镜像。'

export const inverseFormulas = {
  cube: {
    original: 'y=x^3',
    inverse: 'y=\\sqrt[3]{x}',
    axis: 'y=x'
  },
  exp: {
    original: 'y=e^x',
    inverse: 'y=\\ln x',
    axis: 'y=x'
  }
} as const

export const sequenceHint =
  '绿色带是 $|a_n-A|<\\varepsilon$ 的容差范围。拖动 ε，观察需要从第几项开始全部落入带内。'

export function sequenceReadout(epsilon: number, n: number): string {
  return `$a_n=1+\\frac1n$，取 $\\varepsilon=${epsilon.toFixed(2)}$，则 $N=${n}$；当 $n>N$ 时所有点落入带内。`
}

export const limitHint =
  '拖动 ε，绿色竖线之间的曲线整体落在 $1\\pm\\varepsilon$ 的横带内。'

export function limitReadout(epsilon: number, delta: number): string {
  return `取 $\\varepsilon=${epsilon.toFixed(3)}$，对应的 $\\delta\\approx${delta.toFixed(2)}$；当 $0<|x|<\\delta$ 时，$|\\frac{\\sin x}{x}-1|<\\varepsilon$。`
}

export const infinitesimalHint =
  '在 $x\\to0$ 附近，$x$ 与 $\\sin x$ 几乎重合，而 $x^2$ 更快贴近 $0$。'

export const infinitesimalLegend = {
  identity: '$y=x$',
  sine: '$y=\\sin x$'
}

export const eLimitHint =
  '观察数列 $a_n=\\left(1+\\frac1n\\right)^n$ 随 $n$ 增大如何逐步逼近 $e$。'

export function eLimitReadout(n: number, value: number): string {
  return `当 $n=${n}$ 时，$a_n=\\left(1+\\frac1n\\right)^n\\approx${value.toFixed(3)}$；极限为 $e\\approx2.718$。`
}

export const reciprocalHint =
  '拖动 x，观察 $y=x$ 与 $y=1/x$ 的倒数关系：x 越接近 0，1/x 越大；x 越大，1/x 越接近 0。'

export function reciprocalReadout(x: number): string {
  return `$x=${x.toFixed(2)}$，$\\dfrac1x=${(1 / x).toFixed(2)}$。`
}

export const rationalHint =
  '改变分子、分母的次数，观察 $x\\to\\infty$ 时有理函数的极限。'

export function rationalFormula(m: number, n: number): string {
  return String.raw`y=\frac{x^{${m}}}{x^{${n}}+1}`
}

export function rationalReadout(m: number, n: number): string {
  if (m < n) {
    return `$m=${m}<n=${n}$：分母次数更高，极限为 $0$。`
  }
  if (m === n) {
    return `$m=n=${m}$：分子分母同次，极限为首项系数之比 $1$。`
  }
  return `$m=${m}>n=${n}$：分子次数更高，函数无界，极限为 $\\infty$。`
}

export function infinitesimalPowerReadout(power: number): string {
  if (power === 1) {
    return `$p=1$：$x^p=x$，与 $x$ 同阶。`
  }
  return `$p=${power}$：$x^p$ 比 $x$ 高阶，记作 $x^p=o(x)$。`
}

export type ContinuityKind = 'removable' | 'jump' | 'infinite' | 'oscillation'

export const continuityKinds: Record<
  ContinuityKind,
  { label: string; note: string; point: string }
> = {
  removable: {
    label: '可去',
    note: '左右极限都存在且相等，但函数在该点无定义（或函数值不等于极限）。补上定义就能连续。',
    point: '$x=0$ 处是空心点，$\\lim\\limits_{x\\to0}\\frac{\\sin x}{x}=1$'
  },
  jump: {
    label: '跳跃',
    note: '左右极限都存在，但不相等。',
    point: '$\\lim\\limits_{x\\to0^-}f(x)=-1$，$\\lim\\limits_{x\\to0^+}f(x)=1$'
  },
  infinite: {
    label: '无穷',
    note: '至少有一侧的极限为无穷大。',
    point: '$\\lim\\limits_{x\\to0^+}\\frac1x=+\\infty$'
  },
  oscillation: {
    label: '振荡',
    note: '函数值在有限范围内反复振荡，极限不存在。',
    point: '$\\sin\\frac1x$ 在 $x\\to0$ 时无穷次穿过 $[-1,1]$'
  }
}

export const ivtHint =
  '把水平线 $y=C$ 放在最小值与最大值之间，曲线必定与它相交。'

export function ivtReadout(c: number, root: number): string {
  return `$f(x)=x^3-3x+1$ 在 $[0,1]$ 上连续，$f(0)=1$，$f(1)=-1$；对 $C=${c.toFixed(2)}$，解得 $\\xi\\approx${root.toFixed(3)}$。`
}
