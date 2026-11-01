import type { Priority } from '../data/types.ts'
import { priorityLabels } from '../data/priorities.ts'

export function Stars({
  priority,
  size = 'sm'
}: {
  priority: Priority
  size?: 'xs' | 'sm' | 'md'
}) {
  const label = `考试优先级：${priority} 星（${priorityLabels[priority]}）`

  return (
    <span
      className={`stars stars-${size}`}
      role="img"
      aria-label={label}
      title={label}>
      <span className="stars-on" aria-hidden="true">
        {'★'.repeat(priority)}
      </span>
      <span className="stars-off" aria-hidden="true">
        {'★'.repeat(5 - priority)}
      </span>
    </span>
  )
}
