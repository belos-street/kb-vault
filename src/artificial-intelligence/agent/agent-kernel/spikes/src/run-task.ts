// Spike：任务 manifest 的机械校验 + fixture 前置条件检查。
// 真实模型 / loop 执行在 v0.2a 接入；这里先保证 T1/T2/T2a/T2b/T5 的验收条件可被 CI 判定。
// 用法：bun run fixtures/manifests/../run-task.ts（或 bun run src/run-task.ts [t1 t2] [--json]）

import { readFile, readdir, stat } from 'node:fs/promises'
import { basename, isAbsolute, join, resolve } from 'node:path'

export const KILL_POINTS = [
  'after-③',
  'after-④a',
  'after-④b',
  'after-approval-decision',
  'consumer-break'
] as const

export const INVARIANTS = [
  'tool-use-pairing',
  'tool-event-pairing',
  'seq-monotonic',
  'pending-empty-at-terminal'
] as const

export type KillPoint = (typeof KILL_POINTS)[number]
export type Invariant = (typeof INVARIANTS)[number]

export interface ToolCallSpec {
  name: string
  input?: Record<string, unknown>
}

export interface FinalDiff {
  path: string
  from: string
  to: string
}

export interface TaskManifest {
  id: string
  title: string
  input: string
  repo: {
    id: string
    path: string
    commit: string
    initialTree: string[]
  }
  model: {
    mode: 'recorded' | 'live'
    fixture: string
    retries: number
    seed?: number
    temperature?: number
  }
  approval: {
    mode: 'none' | 'allow' | 'ask'
    decision?: 'allow' | 'deny'
    timeoutMs?: number
  }
  expectedTools: {
    mode: 'exact' | 'subsequence'
    sequence: ToolCallSpec[]
  }
  expect: {
    answerContains?: string
    finalDiff?: FinalDiff
    unchangedFiles?: string[]
    removedPaths?: string[]
    errorCode?: string
    exitCode?: number
    eventOrder?: string[]
  }
  budget: {
    maxTurns: number
    maxInputTokens: number
    maxOutputTokens: number
    maxWallTimeMs: number
  }
  killPoints: KillPoint[]
  invariants: Invariant[]
}

export interface ValidationIssue {
  phase: 'schema' | 'fixture'
  path: string
  message: string
}

export interface TaskReport {
  file: string
  id: string | null
  ok: boolean
  issues: ValidationIssue[]
}

export interface RunTaskOptions {
  packageRoot?: string
}

const PACKAGE_ROOT = resolve(import.meta.dir, '..')

export const MANIFEST_REQUIRED_FIELDS = [
  'id',
  'title',
  'input',
  'repo',
  'model',
  'approval',
  'expectedTools',
  'expect',
  'budget',
  'killPoints',
  'invariants'
] as const

const ROOT_KEYS = new Set<string>(MANIFEST_REQUIRED_FIELDS)

const REPO_KEYS = new Set(['id', 'path', 'commit', 'initialTree'])
const MODEL_KEYS = new Set([
  'mode',
  'fixture',
  'retries',
  'seed',
  'temperature'
])
const APPROVAL_KEYS = new Set(['mode', 'decision', 'timeoutMs'])
const EXPECTED_TOOLS_KEYS = new Set(['mode', 'sequence'])
const TOOL_CALL_KEYS = new Set(['name', 'input'])
const EXPECT_KEYS = new Set([
  'answerContains',
  'finalDiff',
  'unchangedFiles',
  'removedPaths',
  'errorCode',
  'exitCode',
  'eventOrder'
])
const DIFF_KEYS = new Set(['path', 'from', 'to'])
const BUDGET_KEYS = new Set([
  'maxTurns',
  'maxInputTokens',
  'maxOutputTokens',
  'maxWallTimeMs'
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function isSafeRelPath(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false
  if (isAbsolute(value) || value.includes('\\') || value.includes(':')) {
    return false
  }
  return value
    .split('/')
    .every((segment) => segment.length > 0 && segment !== '.' && segment !== '..')
}

function isStringArray(value: unknown, guard: (item: unknown) => boolean): boolean {
  return Array.isArray(value) && value.every(guard)
}

export function validateManifest(raw: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const add = (path: string, message: string): void => {
    issues.push({ phase: 'schema', path, message })
  }

  if (!isRecord(raw)) {
    return [{ phase: 'schema', path: '$', message: 'manifest must be an object' }]
  }

  for (const key of Object.keys(raw)) {
    if (!ROOT_KEYS.has(key)) add(key, 'unknown field')
  }
  for (const key of ROOT_KEYS) {
    if (!(key in raw)) add(key, 'required field missing')
  }

  if (!isNonEmptyString(raw.id) || !/^T\d+[ab]?$/.test(raw.id)) {
    add('id', 'expected T1 / T2 / T2a style id')
  }
  if (!isNonEmptyString(raw.title)) add('title', 'non-empty string required')
  if (!isNonEmptyString(raw.input)) add('input', 'non-empty string required')

  const repo = raw.repo
  if (!isRecord(repo)) {
    add('repo', 'object required')
  } else {
    for (const key of Object.keys(repo)) {
      if (!REPO_KEYS.has(key)) add(`repo.${key}`, 'unknown field')
    }
    if (!isNonEmptyString(repo.id)) add('repo.id', 'non-empty string required')
    if (
      !isNonEmptyString(repo.path) ||
      !/^fixtures\/[a-z0-9-]+$/.test(repo.path)
    ) {
      add('repo.path', 'expected fixtures/<id>')
    }
    if (!isNonEmptyString(repo.commit)) {
      add('repo.commit', 'non-empty string required')
    }
    if (
      !Array.isArray(repo.initialTree) ||
      repo.initialTree.length === 0 ||
      !isStringArray(repo.initialTree, isSafeRelPath)
    ) {
      add('repo.initialTree', 'non-empty list of safe relative paths required')
    } else if (
      new Set(repo.initialTree).size !== repo.initialTree.length
    ) {
      add('repo.initialTree', 'duplicate paths')
    }
  }

  const model = raw.model
  if (!isRecord(model)) {
    add('model', 'object required')
  } else {
    for (const key of Object.keys(model)) {
      if (!MODEL_KEYS.has(key)) add(`model.${key}`, 'unknown field')
    }
    if (model.mode !== 'recorded' && model.mode !== 'live') {
      add('model.mode', 'expected recorded or live')
    }
    if (!isNonEmptyString(model.fixture)) {
      add('model.fixture', 'recorded fixture id required')
    }
    if (
      typeof model.retries !== 'number' ||
      !Number.isInteger(model.retries) ||
      model.retries < 0
    ) {
      add('model.retries', 'non-negative integer required')
    }
    if (model.mode === 'live') {
      if (typeof model.seed !== 'number') add('model.seed', 'required for live')
      if (typeof model.temperature !== 'number') {
        add('model.temperature', 'required for live')
      }
    }
    if (
      model.temperature !== undefined &&
      (typeof model.temperature !== 'number' || model.temperature < 0)
    ) {
      add('model.temperature', 'non-negative number required')
    }
  }

  const approval = raw.approval
  if (!isRecord(approval)) {
    add('approval', 'object required')
  } else {
    for (const key of Object.keys(approval)) {
      if (!APPROVAL_KEYS.has(key)) add(`approval.${key}`, 'unknown field')
    }
    if (
      approval.mode !== 'none' &&
      approval.mode !== 'allow' &&
      approval.mode !== 'ask'
    ) {
      add('approval.mode', 'expected none / allow / ask')
    }
    if (approval.mode === 'ask' && approval.decision === undefined) {
      add('approval.decision', 'required when mode is ask')
    }
    if (
      approval.decision !== undefined &&
      approval.decision !== 'allow' &&
      approval.decision !== 'deny'
    ) {
      add('approval.decision', 'expected allow or deny')
    }
    if (approval.decision !== undefined && approval.mode !== 'ask') {
      add('approval.decision', 'only meaningful when mode is ask')
    }
    if (
      approval.timeoutMs !== undefined &&
      !isPositiveInt(approval.timeoutMs)
    ) {
      add('approval.timeoutMs', 'positive integer required')
    }
  }

  const expectedTools = raw.expectedTools
  if (!isRecord(expectedTools)) {
    add('expectedTools', 'object required')
  } else {
    for (const key of Object.keys(expectedTools)) {
      if (!EXPECTED_TOOLS_KEYS.has(key)) {
        add(`expectedTools.${key}`, 'unknown field')
      }
    }
    if (
      expectedTools.mode !== 'exact' &&
      expectedTools.mode !== 'subsequence'
    ) {
      add('expectedTools.mode', 'expected exact or subsequence')
    }
    if (
      !Array.isArray(expectedTools.sequence) ||
      expectedTools.sequence.length === 0
    ) {
      add('expectedTools.sequence', 'non-empty array required')
    } else {
      expectedTools.sequence.forEach((call, index) => {
        if (!isRecord(call)) {
          add(`expectedTools.sequence[${index}]`, 'object required')
          return
        }
        for (const key of Object.keys(call)) {
          if (!TOOL_CALL_KEYS.has(key)) {
            add(`expectedTools.sequence[${index}].${key}`, 'unknown field')
          }
        }
        if (!isNonEmptyString(call.name)) {
          add(`expectedTools.sequence[${index}].name`, 'non-empty string required')
        }
        if (call.input !== undefined && !isRecord(call.input)) {
          add(`expectedTools.sequence[${index}].input`, 'object required')
        }
      })
    }
  }

  const expect = raw.expect
  if (!isRecord(expect)) {
    add('expect', 'object required')
  } else {
    for (const key of Object.keys(expect)) {
      if (!EXPECT_KEYS.has(key)) add(`expect.${key}`, 'unknown field')
    }
    if (Object.keys(expect).length === 0) {
      add('expect', 'at least one assertion required')
    }
    if (expect.answerContains !== undefined && !isNonEmptyString(expect.answerContains)) {
      add('expect.answerContains', 'non-empty string required')
    }
    if (expect.finalDiff !== undefined) {
      validateFinalDiff(expect.finalDiff, add)
    }
    for (const key of ['unchangedFiles', 'removedPaths'] as const) {
      const value = expect[key]
      if (value === undefined) continue
      if (!Array.isArray(value) || value.length === 0 || !isStringArray(value, isSafeRelPath)) {
        add(`expect.${key}`, 'non-empty list of safe relative paths required')
      } else if (new Set(value).size !== value.length) {
        add(`expect.${key}`, 'duplicate paths')
      }
    }
    if (
      expect.errorCode !== undefined &&
      (!isNonEmptyString(expect.errorCode) ||
        !/^[A-Z][A-Z0-9_]*$/.test(expect.errorCode))
    ) {
      add('expect.errorCode', 'UPPER_SNAKE_CASE required')
    }
    if (expect.exitCode !== undefined && !Number.isInteger(expect.exitCode)) {
      add('expect.exitCode', 'integer required')
    }
    if (expect.eventOrder !== undefined) {
      if (
        !Array.isArray(expect.eventOrder) ||
        expect.eventOrder.length < 2 ||
        !isStringArray(expect.eventOrder, isNonEmptyString)
      ) {
        add('expect.eventOrder', 'array of at least two event types required')
      }
    }
  }

  const budget = raw.budget
  if (!isRecord(budget)) {
    add('budget', 'object required')
  } else {
    for (const key of Object.keys(budget)) {
      if (!BUDGET_KEYS.has(key)) add(`budget.${key}`, 'unknown field')
    }
    for (const key of BUDGET_KEYS) {
      if (!isPositiveInt(budget[key])) {
        add(`budget.${key}`, 'positive integer required')
      }
    }
  }

  validateEnumList(raw.killPoints, KILL_POINTS, 'killPoints', add)
  validateEnumList(raw.invariants, INVARIANTS, 'invariants', add, true)

  if (issues.length > 0) return issues

  const manifest = raw as unknown as TaskManifest
  validateCrossFields(manifest, add)
  return issues
}

function validateFinalDiff(
  value: unknown,
  add: (path: string, message: string) => void
): void {
  if (!isRecord(value)) {
    add('expect.finalDiff', 'object required')
    return
  }
  for (const key of Object.keys(value)) {
    if (!DIFF_KEYS.has(key)) {
      add(`expect.finalDiff.${key}`, 'unknown field')
    }
  }
  if (!isSafeRelPath(value.path)) {
    add('expect.finalDiff.path', 'safe relative path required')
  }
  if (!isNonEmptyString(value.from)) {
    add('expect.finalDiff.from', 'non-empty string required')
  }
  if (!isNonEmptyString(value.to)) {
    add('expect.finalDiff.to', 'non-empty string required')
  }
  if (
    isNonEmptyString(value.from) &&
    isNonEmptyString(value.to) &&
    value.from === value.to
  ) {
    add('expect.finalDiff', 'from and to must differ')
  }
}

function validateEnumList<T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
  add: (path: string, message: string) => void,
  requireAll = false
): void {
  if (
    !Array.isArray(value) ||
    !isStringArray(value, (item) => allowed.includes(item as T))
  ) {
    add(path, `expected list of ${allowed.join(' / ')}`)
    return
  }
  if (new Set(value).size !== value.length) {
    add(path, 'duplicate entries')
  }
  if (requireAll) {
    for (const item of allowed) {
      if (!value.includes(item)) add(path, `missing mandatory invariant: ${item}`)
    }
  }
}

function validateCrossFields(
  manifest: TaskManifest,
  add: (path: string, message: string) => void
): void {
  const { approval, expect, killPoints, invariants, expectedTools } = manifest

  if (approval.mode !== 'ask' && expect.eventOrder?.includes('approval-requested')) {
    add('expect.eventOrder', 'approval-requested requires approval.mode=ask')
  }

  if (approval.decision === 'deny') {
    if (expect.errorCode !== 'APPROVAL_DENIED') {
      add('expect.errorCode', 'deny branch must judge APPROVAL_DENIED')
    }
    for (const event of ['approval-requested', 'tool-call-cancelled']) {
      if (!expect.eventOrder?.includes(event)) {
        add('expect.eventOrder', `deny branch must assert ${event}`)
      }
    }
    for (const key of ['finalDiff', 'removedPaths', 'answerContains'] as const) {
      if (expect[key] !== undefined) {
        add(`expect.${key}`, 'deny branch must not assert a successful write')
      }
    }
  }

  if (approval.decision === 'allow') {
    if (expect.errorCode === 'APPROVAL_DENIED') {
      add('expect.errorCode', 'allow branch cannot judge APPROVAL_DENIED')
    }
    for (const event of ['approval-requested', 'tool-call-completed']) {
      if (!expect.eventOrder?.includes(event)) {
        add('expect.eventOrder', `allow branch must assert ${event}`)
      }
    }
  }

  if (killPoints.includes('after-approval-decision') && approval.mode !== 'ask') {
    add('killPoints', 'after-approval-decision requires approval.mode=ask')
  }

  if (expectedTools.mode === 'exact' && expectedTools.sequence.length === 0) {
    add('expectedTools.sequence', 'exact mode requires a non-empty sequence')
  }

  const changed = expect.finalDiff?.path
  if (changed !== undefined && expect.unchangedFiles?.includes(changed)) {
    add('expect.unchangedFiles', `contradicts finalDiff path: ${changed}`)
  }
  for (const path of expect.removedPaths ?? []) {
    if (expect.unchangedFiles?.includes(path)) {
      add('expect.unchangedFiles', `contradicts removed path: ${path}`)
    }
  }

  if (invariants.length !== INVARIANTS.length) {
    add('invariants', 'all four invariants must be declared')
  }
}

export async function checkFixture(
  manifest: TaskManifest,
  packageRoot = PACKAGE_ROOT
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = []
  const add = (path: string, message: string): void => {
    issues.push({ phase: 'fixture', path, message })
  }
  const repoRoot = resolve(packageRoot, manifest.repo.path)

  if (!(await isDirectory(repoRoot))) {
    add('repo.path', `fixture repo not found: ${repoRoot}`)
    return issues
  }

  for (const path of manifest.repo.initialTree) {
    if (!(await isFile(join(repoRoot, path)))) {
      add(
        `repo.initialTree`,
        `initial file missing: ${path}`
      )
    }
  }

  const diff = manifest.expect.finalDiff
  if (diff !== undefined) {
    const file = join(repoRoot, diff.path)
    if (!(await isFile(file))) {
      add('expect.finalDiff.path', `file missing: ${diff.path}`)
    } else {
      const source = await readFile(file, 'utf8')
      if (!source.includes(diff.from)) {
        add('expect.finalDiff.from', `fixture does not contain: ${diff.from}`)
      }
      if (source.includes(diff.to)) {
        add('expect.finalDiff.to', `fixture already contains: ${diff.to}`)
      }
    }
  }

  for (const [index, call] of manifest.expectedTools.sequence.entries()) {
    if (call.name !== 'edit') continue
    const path = call.input?.path
    const from = call.input?.from
    if (!isSafeRelPath(path) || !isNonEmptyString(from)) continue
    const file = join(repoRoot, path)
    if (!(await isFile(file))) {
      add(`expectedTools.sequence[${index}]`, `edit target missing: ${path}`)
    } else if (!(await readFile(file, 'utf8')).includes(from)) {
      add(
        `expectedTools.sequence[${index}]`,
        `edit target does not contain: ${from}`
      )
    }
  }

  for (const path of manifest.expect.unchangedFiles ?? []) {
    if (!(await isFile(join(repoRoot, path)))) {
      add('expect.unchangedFiles', `file missing: ${path}`)
    }
  }

  for (const path of manifest.expect.removedPaths ?? []) {
    if (!(await isEntry(join(repoRoot, path)))) {
      add('expect.removedPaths', `path missing before run: ${path}`)
    }
  }

  return issues
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile()
  } catch {
    return false
  }
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory()
  } catch {
    return false
  }
}

async function isEntry(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

export async function runTask(
  file: string,
  options: RunTaskOptions = {}
): Promise<TaskReport> {
  const packageRoot = options.packageRoot ?? PACKAGE_ROOT
  let raw: unknown
  try {
    raw = JSON.parse(await readFile(file, 'utf8'))
  } catch (error) {
    return {
      file,
      id: null,
      ok: false,
      issues: [
        {
          phase: 'schema',
          path: '$',
          message: `cannot read/parse manifest: ${String(error)}`
        }
      ]
    }
  }

  const id = isRecord(raw) && isNonEmptyString(raw.id) ? raw.id : null
  const issues = validateManifest(raw)

  if (issues.length === 0 && id !== null) {
    const expectedName = basename(file, '.json')
    if (id.toLowerCase() !== expectedName.toLowerCase()) {
      issues.push({
        phase: 'schema',
        path: 'id',
        message: `id ${id} does not match file name ${expectedName}.json`
      })
    }
  }

  if (issues.length === 0) {
    issues.push(...(await checkFixture(raw as unknown as TaskManifest, packageRoot)))
  }

  return { file, id, ok: issues.length === 0, issues }
}

async function main(argv: string[]): Promise<number> {
  const json = argv.includes('--json')
  const ids = argv.filter((arg) => !arg.startsWith('--'))
  const manifestsDir = join(PACKAGE_ROOT, 'fixtures', 'manifests')

  const files =
    ids.length > 0
      ? ids.map((id) => join(manifestsDir, `${id.toLowerCase()}.json`))
      : (await readdir(manifestsDir))
          .filter((name) => name.endsWith('.json') && !name.startsWith('task-'))
          .sort()
          .map((name) => join(manifestsDir, name))

  const reports = await Promise.all(files.map((file) => runTask(file)))

  if (json) {
    console.log(JSON.stringify(reports, null, 2))
  } else {
    for (const report of reports) {
      const label = report.id ?? basename(report.file)
      console.log(`${report.ok ? 'PASS' : 'FAIL'}  ${label}  ${report.file}`)
      for (const issue of report.issues) {
        console.log(`  [${issue.phase}] ${issue.path}: ${issue.message}`)
      }
    }
    const passed = reports.filter((report) => report.ok).length
    console.log(`\n${passed}/${reports.length} manifests valid`)
  }

  return reports.every((report) => report.ok) ? 0 : 1
}

if (import.meta.main) {
  process.exit(await main(process.argv.slice(2)))
}
