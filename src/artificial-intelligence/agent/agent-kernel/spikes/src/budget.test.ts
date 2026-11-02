import { describe, expect, test } from 'bun:test'
import { assertBudget, BudgetExceededError } from './budget'

describe('budget precheck', () => {
  test('allows usage under the limit', () => {
    expect(() =>
      assertBudget({ inputTokens: 10, outputTokens: 5 }, 100),
    ).not.toThrow()
  })

  test('throws BudgetExceededError before the model call', () => {
    expect(() =>
      assertBudget({ inputTokens: 60, outputTokens: 40 }, 100),
    ).toThrow(BudgetExceededError)
  })
})
