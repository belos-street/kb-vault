import type { ComponentType } from 'react'
import type { DemoId } from '../data/types.ts'
import { ContinuityDemo } from './continuity.tsx'
import { ELimitDemo } from './e-limit.tsx'
import { FunctionLab } from './function-lab.tsx'
import { InfinitesimalDemo } from './infinitesimal.tsx'
import { InverseDemo } from './inverse.tsx'
import { IvtDemo } from './ivt.tsx'
import { LimitDemo } from './limit.tsx'
import { MappingDemo } from './mapping.tsx'
import { SequenceDemo } from './sequence.tsx'

const registry: Record<DemoId, ComponentType> = {
  mapping: MappingDemo,
  'function-lab': FunctionLab,
  inverse: InverseDemo,
  sequence: SequenceDemo,
  limit: LimitDemo,
  infinitesimal: InfinitesimalDemo,
  continuity: ContinuityDemo,
  ivt: IvtDemo,
  'e-limit': ELimitDemo
}

export function Demo({ id }: { id: DemoId }) {
  const Component = registry[id]
  return <Component />
}
