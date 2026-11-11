import type { DemoId } from '../data/types.ts'
import { ChunkLabDemo } from './chunk-lab.tsx'
import { ContextWindowDemo } from './context-window.tsx'
import { FrameworkRewriteDemo } from './framework-rewrite.tsx'
import { MemoryLifecycleDemo } from './memory-lifecycle.tsx'
import { MessageRolesDemo } from './message-roles.tsx'
import { MiddlewarePipelineDemo } from './middleware-pipeline.tsx'
import { ModelPickerDemo } from './model-picker.tsx'
import { OutputContractDemo } from './output-contract.tsx'
import { TraceTreeDemo } from './trace-tree.tsx'
import { PromptLabDemo } from './prompt-lab.tsx'
import { ReactLoopDemo } from './react-loop.tsx'
import { RetrievalPipelineDemo } from './retrieval-pipeline.tsx'
import { SseStreamDemo } from './sse-stream.tsx'
import { TokenCostDemo } from './token-cost.tsx'
import { ToolContractDemo } from './tool-contract.tsx'

export function Demo({ id }: { id: DemoId }) {
  switch (id) {
    case 'token-cost':
      return <TokenCostDemo />
    case 'context-window':
      return <ContextWindowDemo />
    case 'model-picker':
      return <ModelPickerDemo />
    case 'sse-stream':
      return <SseStreamDemo />
    case 'prompt-lab':
      return <PromptLabDemo />
    case 'react-loop':
      return <ReactLoopDemo />
    case 'tool-contract':
      return <ToolContractDemo />
    case 'output-contract':
      return <OutputContractDemo />
    case 'chunk-lab':
      return <ChunkLabDemo />
    case 'retrieval-pipeline':
      return <RetrievalPipelineDemo />
    case 'middleware-pipeline':
      return <MiddlewarePipelineDemo />
    case 'framework-rewrite':
      return <FrameworkRewriteDemo />
    case 'message-roles':
      return <MessageRolesDemo />
    case 'memory-lifecycle':
      return <MemoryLifecycleDemo />
    case 'trace-tree':
      return <TraceTreeDemo />
  }
}
