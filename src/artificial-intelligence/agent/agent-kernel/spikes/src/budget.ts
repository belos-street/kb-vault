import type { Usage } from './checkpoint-resume'

export class BudgetExceededError extends Error {
  override readonly name = 'BudgetExceededError'

  constructor(readonly usedTokens: number, readonly maxTokens: number) {
    super(`budget exceeded: ${usedTokens}/${maxTokens}`)
  }
}

export function assertBudget(usage: Usage, maxTokens?: number): void {
  if (maxTokens === undefined) return
  const used = usage.inputTokens + usage.outputTokens
  if (used >= maxTokens) {
    throw new BudgetExceededError(used, maxTokens)
  }
}
