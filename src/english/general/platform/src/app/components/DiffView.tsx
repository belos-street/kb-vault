import type { DiffOp } from '../utils/lcs.ts'

/** 听写 / 句子默写共用的 diff 三色标注（漏词红 / 多词删除线） */
export function DiffView({ ops }: { ops: DiffOp[] }) {
  return (
    <div className="diff">
      {ops.map((op, i) => (
        <span key={i} className={op.type}>
          {op.token}
        </span>
      ))}
    </div>
  )
}
