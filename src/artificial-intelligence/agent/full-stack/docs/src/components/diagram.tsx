import { useId } from 'react'
import type { Block, DiagramNode } from '../data/types.ts'

type DiagramBlock = Extract<Block, { kind: 'diagram' }>
type Box = DiagramNode & { w: number; h: number }

const cjkPattern = /[\u2e80-\u9fff\uff00-\uffef]/

function textWidth(text: string): number {
  let width = 0
  for (const char of text) {
    width += cjkPattern.test(char) ? 12 : 6.6
  }
  return width
}

function boxOf(node: DiagramNode): Box {
  const labelWidth = Math.max(
    textWidth(node.label),
    node.sub ? textWidth(node.sub) * 0.92 : 0
  )
  return {
    ...node,
    w: node.w ?? Math.min(280, Math.max(104, labelWidth + 30)),
    h: node.h ?? (node.sub ? 54 : 38)
  }
}

function anchor(from: Box, to: Box) {
  const dx = to.x + to.w / 2 - (from.x + from.w / 2)
  const dy = to.y + to.h / 2 - (from.y + from.h / 2)

  if (Math.abs(dx) >= Math.abs(dy)) {
    const y = from.y + from.h / 2
    const targetY = to.y + to.h / 2
    return dx >= 0
      ? { x1: from.x + from.w, y1: y, x2: to.x, y2: targetY }
      : { x1: from.x, y1: y, x2: to.x + to.w, y2: targetY }
  }

  const x = from.x + from.w / 2
  const targetX = to.x + to.w / 2
  return dy >= 0
    ? { x1: x, y1: from.y + from.h, x2: targetX, y2: to.y }
    : { x1: x, y1: from.y, x2: targetX, y2: to.y + to.h }
}

function edgeGeometry(from: Box, to: Box, bend = 0) {
  const { x1, y1, x2, y2 } = anchor(from, to)

  if (bend === 0) {
    return {
      path: `M ${x1} ${y1} L ${x2} ${y2}`,
      labelX: (x1 + x2) / 2,
      labelY: (y1 + y2) / 2
    }
  }

  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.hypot(dx, dy) || 1
  const cx = (x1 + x2) / 2 - (dy / length) * bend
  const cy = (y1 + y2) / 2 + (dx / length) * bend

  return {
    path: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`,
    labelX: (x1 + 2 * cx + x2) / 4,
    labelY: (y1 + 2 * cy + y2) / 4
  }
}

export function Diagram({ block }: { block: DiagramBlock }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const markerId = `diagram-arrow-${uid}`
  const boxes = new Map(block.nodes.map((node) => [node.id, boxOf(node)]))

  return (
    <figure className="diagram">
      <div className="diagram-head">
        <span className="diagram-tag">架构图</span>
        <strong>{block.title}</strong>
      </div>
      <div className="diagram-canvas">
        <svg
          viewBox={`0 0 ${block.width} ${block.height}`}
          role="img"
          aria-label={block.title}>
          <defs>
            <marker
              id={markerId}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 Z" className="diagram-arrow" />
            </marker>
          </defs>

          {(block.groups ?? []).map((group, index) => (
            <g
              key={index}
              className={`diagram-group tone-${group.tone ?? 'muted'}`}>
              <rect
                x={group.x}
                y={group.y}
                width={group.w}
                height={group.h}
                rx="10"
              />
              <text x={group.x + 14} y={group.y + 20}>
                {group.label}
              </text>
            </g>
          ))}

          {(block.edges ?? []).map((edge, index) => {
            const from = boxes.get(edge.from)
            const to = boxes.get(edge.to)
            if (!from || !to) return null

            const geometry = edgeGeometry(from, to, edge.bend)
            return (
              <g
                key={index}
                className={
                  edge.dashed ? 'diagram-edge dashed' : 'diagram-edge'
                }>
                <path d={geometry.path} markerEnd={`url(#${markerId})`} />
                {edge.label ? (
                  <text
                    x={geometry.labelX}
                    y={geometry.labelY - 5}
                    textAnchor="middle">
                    {edge.label}
                  </text>
                ) : null}
              </g>
            )
          })}

          {block.nodes.map((node) => {
            const box = boxes.get(node.id)
            if (!box) return null

            const cx = box.x + box.w / 2
            const cy = box.y + box.h / 2
            return (
              <g
                key={node.id}
                className={`diagram-node tone-${node.tone ?? 'muted'}`}>
                <rect x={box.x} y={box.y} width={box.w} height={box.h} rx="8" />
                <text
                  x={cx}
                  y={box.sub ? cy - 3 : cy + 4}
                  textAnchor="middle"
                  className={
                    node.mono ? 'diagram-label mono' : 'diagram-label'
                  }>
                  {node.label}
                </text>
                {box.sub ? (
                  <text
                    x={cx}
                    y={cy + 15}
                    textAnchor="middle"
                    className="diagram-sub">
                    {box.sub}
                  </text>
                ) : null}
              </g>
            )
          })}
        </svg>
      </div>
      {block.caption ? (
        <figcaption className="diagram-caption">{block.caption}</figcaption>
      ) : null}
    </figure>
  )
}
