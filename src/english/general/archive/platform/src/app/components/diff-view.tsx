import { Fragment } from 'react'
import type { DiffOp } from '../utils/lcs.ts'

/** 听写 / 句子默写共用的 diff 三色标注（漏词红 / 多词删除线） */
export function DiffView({ ops }: { ops: DiffOp[] }) {
  return (
    <div className="diff">
      {/* token 之间必须补真实空格：inline span 相邻而无空白时没有软换行点，长句会横向溢出盒子 */}
      {ops.map((op, i) => (
        <Fragment key={i}>
          <span className={op.type}>{op.token}</span>{' '}
        </Fragment>
      ))}
    </div>
  )
}
