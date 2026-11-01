import { useState } from 'react'
import { DemoFrame } from './frame.tsx'

type Mode = 'injective' | 'surjective' | 'bijective'

const configs: Record<
  Mode,
  {
    label: string
    note: string
    a: number[]
    b: string[]
    arrows: [number, number][]
  }
> = {
  injective: {
    label: '单射',
    note: '每个像只被一个原像命中，但陪域里有元素没被用到。',
    a: [1, 2, 3, 4, 5],
    b: ['a', 'b', 'c', 'd', 'e', 'f'],
    arrows: [
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
      [4, 4]
    ]
  },
  surjective: {
    label: '满射',
    note: '陪域每个元素都有原像，但有两个原像撞到了同一个像。',
    a: [1, 2, 3, 4, 5, 6],
    b: ['a', 'b', 'c', 'd', 'e'],
    arrows: [
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
      [4, 4],
      [5, 4]
    ]
  },
  bijective: {
    label: '双射',
    note: '既不撞车又全覆盖，因此可以定义逆映射。',
    a: [1, 2, 3, 4, 5],
    b: ['a', 'b', 'c', 'd', 'e'],
    arrows: [
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
      [4, 4]
    ]
  }
}

const NODE_Y = 168
const STEP = 44

function nodeY(index: number, count: number): number {
  return NODE_Y + (index - (count - 1) / 2) * STEP
}

export function MappingDemo() {
  const [mode, setMode] = useState<Mode>('injective')
  const config = configs[mode]
  const leftX = 132
  const rightX = 428

  return (
    <DemoFrame
      title="映射的分类"
      hint={config.note}
      controls={
        <div className="seg">
          {(Object.keys(configs) as Mode[]).map((key) => (
            <button
              key={key}
              className={key === mode ? 'active' : ''}
              onClick={() => setMode(key)}
              type="button">
              {configs[key].label}
            </button>
          ))}
        </div>
      }>
      <svg
        className="mapping-svg"
        viewBox="0 0 560 340"
        role="img"
        aria-label={`${config.label}示例`}>
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="mapping-arrow-head" />
          </marker>
        </defs>

        <ellipse
          cx={leftX}
          cy={NODE_Y}
          rx={78}
          ry={(config.b.length * STEP) / 2 + 28}
          className="mapping-set"
        />
        <ellipse
          cx={rightX}
          cy={NODE_Y}
          rx={78}
          ry={(config.b.length * STEP) / 2 + 28}
          className="mapping-set"
        />
        <text
          x={leftX}
          y={44}
          textAnchor="middle"
          className="mapping-set-label">
          X（定义域）
        </text>
        <text
          x={rightX}
          y={44}
          textAnchor="middle"
          className="mapping-set-label">
          Y（陪域）
        </text>

        {config.arrows.map(([from, to]) => {
          const y1 = nodeY(from, config.a.length)
          const y2 = nodeY(to, config.b.length)
          const x1 = leftX + 18
          const x2 = rightX - 18
          return (
            <path
              key={`${from}-${to}`}
              d={`M ${x1} ${y1} C ${x1 + 90} ${y1}, ${x2 - 90} ${y2}, ${x2} ${y2}`}
              className="mapping-arrow"
              markerEnd="url(#arrow)"
            />
          )
        })}

        {config.a.map((value, index) => (
          <g key={`a-${value}`}>
            <circle
              cx={leftX}
              cy={nodeY(index, config.a.length)}
              r={14}
              className="mapping-node"
            />
            <text
              x={leftX}
              y={nodeY(index, config.a.length) + 5}
              textAnchor="middle"
              className="mapping-node-label">
              {value}
            </text>
          </g>
        ))}

        {config.b.map((value, index) => (
          <g key={`b-${value}`}>
            <circle
              cx={rightX}
              cy={nodeY(index, config.b.length)}
              r={14}
              className="mapping-node mapping-node-right"
            />
            <text
              x={rightX}
              y={nodeY(index, config.b.length) + 5}
              textAnchor="middle"
              className="mapping-node-label">
              {value}
            </text>
          </g>
        ))}
      </svg>
    </DemoFrame>
  )
}
