import { describe, expect, test } from 'bun:test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  checkFixture,
  INVARIANTS,
  KILL_POINTS,
  MANIFEST_REQUIRED_FIELDS,
  runTask,
  validateManifest,
  type TaskManifest
} from './run-task'

const fixturesRoot = join(import.meta.dir, '..', 'fixtures')
const manifestsDir = join(fixturesRoot, 'manifests')

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T
}

async function load(id: string): Promise<TaskManifest> {
  const report = await runTask(join(manifestsDir, `${id}.json`))
  expect(report.ok).toBe(true)
  return readJson<TaskManifest>(report.file)
}

function asRecord(value: unknown): Record<string, unknown> {
  return value as Record<string, unknown>
}

describe('task manifests', () => {
  test('T1/T2/T2a/T2b/T5 pass mechanical validation', async () => {
    for (const id of ['t1', 't2', 't2a', 't2b', 't5']) {
      const report = await runTask(join(manifestsDir, `${id}.json`))
      expect(report.ok).toBe(true)
      expect(report.issues).toEqual([])
    }
  })

  test('T1 reads the declared file and has a budget', async () => {
    const manifest = await load('t1')

    expect(manifest.id).toBe('T1')
    expect(manifest.repo.path).toBe('fixtures/basic')
    expect(manifest.expectedTools.mode).toBe('exact')
    expect(manifest.expectedTools.sequence).toEqual([
      { name: 'read', input: { path: 'src/hello.ts' } }
    ])
    expect(manifest.expect.answerContains).toBe('greet')
    expect(manifest.budget.maxTurns).toBe(2)

    const source = await readFile(
      join(fixturesRoot, 'basic', 'src', 'hello.ts'),
      'utf8'
    )
    expect(source).toContain('export function greet')
  })

  test('T2 fixed allow has a concrete diff assertion', async () => {
    const manifest = await load('t2')

    expect(manifest.id).toBe('T2')
    expect(manifest.approval.mode).toBe('none')
    expect(manifest.expectedTools.sequence.map((tool) => tool.name)).toEqual([
      'read',
      'edit'
    ])
    expect(manifest.expect.finalDiff).toEqual({
      path: 'src/greeting.ts',
      from: 'Hello from Kern',
      to: 'Hi from Kern'
    })
    expect(manifest.budget.maxTurns).toBe(3)

    const source = await readFile(
      join(fixturesRoot, 'basic', 'src', 'greeting.ts'),
      'utf8'
    )
    expect(source).toContain('Hello from Kern')
    expect(source).not.toContain('Hi from Kern')
  })

  test('T2a and T2b judge the allow / deny branches', async () => {
    const allow = await load('t2a')
    const deny = await load('t2b')

    expect(allow.id).toBe('T2a')
    expect(allow.approval.mode).toBe('allow')
    expect(allow.expect.finalDiff).toEqual({
      path: 'src/greeting.ts',
      from: 'Hello from Kern',
      to: 'Hi from Kern'
    })

    expect(deny.id).toBe('T2b')
    expect(deny.approval.mode).toBe('ask')
    expect(deny.approval.decision).toBe('deny')
    expect(deny.expect.errorCode).toBe('APPROVAL_DENIED')
    expect(deny.expect.eventOrder).toContain('approval-requested')
    expect(deny.expect.eventOrder).toContain('tool-call-cancelled')
    expect(deny.expect.finalDiff).toBeUndefined()
    expect(deny.expect.unchangedFiles).toContain('src/greeting.ts')
  })

  test('T5 asks before bash and records the approval order', async () => {
    const manifest = await load('t5')

    expect(manifest.id).toBe('T5')
    expect(manifest.approval.mode).toBe('ask')
    expect(manifest.approval.decision).toBe('allow')
    expect(manifest.expectedTools.sequence.map((tool) => tool.name)).toEqual([
      'bash'
    ])
    expect(manifest.expect.eventOrder).toEqual([
      'approval-requested',
      'tool-call-started',
      'tool-call-completed'
    ])
    expect(manifest.expect.removedPaths).toEqual(['tmp'])
  })

  test('schema required fields and enums match the runner', async () => {
    const schema = await readJson<{
      required: string[]
      properties: Record<string, unknown>
      $defs: {
        invariant: { enum: string[] }
        killPoint: { enum: string[] }
      }
    }>(join(manifestsDir, 'task-manifest.schema.json'))

    expect(schema.required).toEqual([...MANIFEST_REQUIRED_FIELDS])
    expect(Object.keys(schema.properties)).toEqual([
      ...MANIFEST_REQUIRED_FIELDS
    ])
    expect(schema.$defs.invariant.enum).toEqual([...INVARIANTS])
    expect(schema.$defs.killPoint.enum).toEqual([...KILL_POINTS])
  })

  test('rejects the legacy flat manifest shape', () => {
    const issues = validateManifest({
      id: 'T1',
      repo: 'fixtures/basic',
      commit: 'local-dev',
      input: 'read src/hello.ts',
      expectedTools: [{ name: 'read', input: { path: 'src/hello.ts' } }],
      maxTurns: 2
    })

    expect(issues.map((issue) => issue.path)).toContain('model')
    expect(issues.map((issue) => issue.path)).toContain('budget')
    expect(issues.map((issue) => issue.path)).toContain('killPoints')
    expect(issues.map((issue) => issue.path)).toContain('invariants')
  })

  test('rejects a deny branch without APPROVAL_DENIED', async () => {
    const raw = await readJson<Record<string, unknown>>(
      join(manifestsDir, 't2b.json')
    )
    const expectBlock = asRecord(raw.expect)
    delete expectBlock.errorCode

    const issues = validateManifest(raw)
    expect(issues.map((issue) => issue.path)).toContain('expect.errorCode')
  })

  test('rejects a manifest missing a mandatory invariant', async () => {
    const raw = await readJson<Record<string, unknown>>(
      join(manifestsDir, 't1.json')
    )
    raw.invariants = ['tool-use-pairing', 'seq-monotonic']

    const issues = validateManifest(raw)
    expect(issues.some((issue) => issue.path === 'invariants')).toBe(true)
  })

  test('rejects a fixture whose diff was already applied', async () => {
    const manifest = await load('t2')
    const inverted: TaskManifest = {
      ...manifest,
      expect: {
        ...manifest.expect,
        finalDiff: {
          path: 'src/greeting.ts',
          from: 'Hi from Kern',
          to: 'Hello from Kern'
        }
      }
    }

    const issues = await checkFixture(inverted)
    expect(issues.some((issue) => issue.path === 'expect.finalDiff.from')).toBe(
      true
    )
  })
})
