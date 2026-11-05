/**
 * 终端输出小工具 —— 与 LangGraph 本身无关，只是让 demo 好看一点。
 * 每一课都可以单独运行，不用先读这个文件。
 */

const colorEnabled = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR

const paint = (code: number) => (text: string) =>
  colorEnabled ? `\u001b[${code}m${text}\u001b[0m` : text

export const dim = paint(90)
export const bold = paint(1)
export const red = paint(31)
export const green = paint(32)
export const yellow = paint(33)
export const cyan = paint(36)
export const magenta = paint(35)

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

/** 中文字符在终端里占两格，按「显示宽度」算才能对齐 */
function displayWidth(text: string): number {
  let width = 0
  for (const char of text) {
    width += (char.codePointAt(0) ?? 0) > 0x2e80 ? 2 : 1
  }
  return width
}

const pad = (text: string, target: number) =>
  text + ' '.repeat(Math.max(0, target - displayWidth(text)))

/** 每一课的标题 */
export function banner(no: string, title: string) {
  console.log('\n' + cyan('═'.repeat(60)))
  console.log(cyan(` ${no} · ${title}`))
  console.log(cyan('═'.repeat(60)))
}

/** 一节小标题 */
export function section(label: string) {
  const head = `── ${label} `
  console.log(
    '\n' + yellow(head) + dim('─'.repeat(Math.max(0, 60 - displayWidth(head))))
  )
}

/** 键值对 */
export function kv(key: string, value: unknown) {
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  console.log(`  ${dim(pad(key, 12))} ${text}`)
}

/** 节点执行日志：让你直观看到「图」是一步一步跑的 */
export function step(name: string, detail = '') {
  console.log(`  ${green('▸')} ${bold(pad(name, 10))} ${dim(detail)}`)
}
