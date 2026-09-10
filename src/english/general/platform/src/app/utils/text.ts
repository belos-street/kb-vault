/** 判分归一化（requirements.md Q3）：小写、去标点、压缩空白 —— 大小写与标点不敏感 */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** token 化（听写 diff 与词匹配共用） */
export function tokenize(s: string): string[] {
  return normalizeText(s)
    .split(' ')
    .filter((t) => t.length > 0)
}

/** 轻量词形归并：去 s/es/ed/ing + 双写辅音还原（足够覆盖课文词形） */
export function stem(token: string): string {
  let s = token
  if (s.length > 4 && s.endsWith('ies')) return `${s.slice(0, -3)}y`
  if (s.length > 4 && /(ches|shes|ses|xes|zes)$/.test(s)) return s.slice(0, -2)
  if (s.length > 3 && s.endsWith('s') && !s.endsWith('ss')) s = s.slice(0, -1)
  if (s.length > 5 && s.endsWith('ing')) {
    s = s.slice(0, -3)
    if (/(.)\1$/.test(s)) s = s.slice(0, -1)
  } else if (s.length > 4 && s.endsWith('ed')) {
    s = s.slice(0, -2)
    if (/(.)\1$/.test(s)) s = s.slice(0, -1)
  }
  return s
}

/** 句子是否含给定词表中的词（词形归并后匹配） */
export function usesAnyWord(sentence: string, words: Set<string>): boolean {
  return tokenize(sentence).some((t) => words.has(stem(t)))
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const ai = a[i]
    const aj = a[j]
    if (ai === undefined || aj === undefined) continue
    a[i] = aj
    a[j] = ai
  }
  return a
}
