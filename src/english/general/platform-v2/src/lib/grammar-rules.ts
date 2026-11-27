interface UnitRef {
  unit: { id: string }
}

/**
 * 锚句规则：可以跨讲，但必须同单元，且被引用讲必须有内容。
 * 抽成纯函数，validate 与测试共用同一句规则原文。
 */
export function checkAnchorUnit(
  lessonId: string,
  anchorLessonId: string,
  unitOf: (id: string) => UnitRef | undefined
): string | null {
  const anchorUnit = unitOf(anchorLessonId)
  if (!anchorUnit) return `锚句引用了不存在的讲：${anchorLessonId}`

  const lessonUnit = unitOf(lessonId)
  if (lessonUnit && anchorUnit.unit.id !== lessonUnit.unit.id) {
    return `锚句跨单元：${anchorLessonId}（规则：锚句必须来自同单元已上线讲）`
  }
  return null
}
