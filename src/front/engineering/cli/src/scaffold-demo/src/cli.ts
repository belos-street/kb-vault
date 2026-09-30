#!/usr/bin/env bun
import { Command } from 'commander'
import { input, select, confirm } from '@inquirer/prompts'
import pc from 'picocolors'
import ora from 'ora'
import { mkdir, writeFile, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'

interface Options {
  template?: string
  force?: boolean
}

// 探测路径存在性：必须用 stat（readFile 对目录抛 EISDIR 会被 catch 吞掉，
// 导致"目录已存在"检测失效 → 静默覆盖）
async function exists(p: string) {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

const program = new Command()

program
  .name('my-create')
  .description('团队项目脚手架（cli/doc/02 的可运行示例）')
  .version('0.1.0')
  .argument('[name]', '项目名')
  .option('-t, --template <tpl>', '直接指定模板，跳过询问')
  .option('-f, --force', '目标目录已存在时也继续')
  .action(async (name: string | undefined, opts: Options) => {
    if (process.env.CI && !name) {
      console.error(pc.red('CI 环境必须显式传入项目名：my-create <name>'))
      process.exit(1)
    }

    console.log(pc.bold(pc.cyan('⚡ my-create')))

    // ── 交互层：缺什么问什么 ─────────────────────────────
    const projectName = name ?? (await input({ message: '项目名叫什么？' }))
    const targetDir = resolve(process.cwd(), projectName)

    if ((await exists(targetDir)) && !opts.force) {
      const goOn = await confirm({ message: '目录已存在，覆盖继续？' })
      if (!goOn) return
    }

    const template =
      opts.template ??
      (await select({
        message: '选个模板',
        choices: [
          { value: 'vanilla', name: 'Vanilla TS' },
          { value: 'react', name: 'React + Vite' },
          { value: 'node', name: 'Node 工具库' },
        ],
      }))

    // ── 执行层：模板渲染 → 写文件 ────────────────────────
    const spinner = ora('生成项目...').start()
    try {
      await mkdir(targetDir, { recursive: true })

      const pkg = {
        name: projectName,
        version: '0.0.0',
        type: 'module',
      }
      await writeFile(join(targetDir, 'package.json'), JSON.stringify(pkg, null, 2))
      await writeFile(
        join(targetDir, 'index.ts'),
        `// ${template} 模板\nexport const hello = () => 'hi'\n`,
      )
      spinner.succeed(`项目已生成：${pc.cyan(projectName)}`)
      console.log(`\n  cd ${projectName} && bun install`)
    } catch (err) {
      spinner.fail('生成失败')
      console.error(pc.red(err instanceof Error ? err.message : String(err)))
      process.exit(1)
    }
  })

program.parse()
