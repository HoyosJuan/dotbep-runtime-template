#!/usr/bin/env node
import * as p from '@clack/prompts'
import {
  copyFileSync, mkdirSync, readdirSync,
  statSync, existsSync, renameSync,
} from 'node:fs'
import { join, dirname, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname   = dirname(fileURLToPath(import.meta.url))
const templateDir = join(__dirname, '..', 'templates')
const isInteractive = process.stdin.isTTY

async function main() {
  if (isInteractive) {
    await interactiveMode()
  } else {
    await silentMode()
  }
}

async function interactiveMode() {
  p.intro('create-dotbep-runtime')

  const useCurrentDir = await p.confirm({
    message:      `Scaffold in current directory? (${basename(resolve('.'))})`,
    initialValue: true,
  })
  if (p.isCancel(useCurrentDir)) { p.cancel('Cancelled.'); process.exit(0) }

  let targetDir: string

  if (useCurrentDir) {
    targetDir = '.'
  } else {
    const name = await p.text({
      message:  'Project directory:',
      validate: (v) => v.trim() ? undefined : 'Directory name cannot be empty.',
    })
    if (p.isCancel(name)) { p.cancel('Cancelled.'); process.exit(0) }
    targetDir = (name as string).trim()
  }

  const outDir      = resolve(targetDir)
  const projectName = basename(outDir)

  if (existsSync(outDir) && readdirSync(outDir).length > 0) {
    const overwrite = await p.confirm({
      message:      `"${targetDir}" is not empty. Continue anyway?`,
      initialValue: false,
    })
    if (p.isCancel(overwrite) || !overwrite) { p.cancel('Cancelled.'); process.exit(0) }
  }

  const s = p.spinner()
  s.start('Scaffolding project...')
  scaffold(outDir)
  s.stop(`Project "${projectName}" created.`)

  p.note(
    [
      'Rename AGENTS.md to match your AI agent:',
      '',
      '  Claude Code          →  CLAUDE.md',
      '  Gemini CLI           →  GEMINI.md',
      '  Cursor / Windsurf    →  keep as AGENTS.md',
      '  OpenAI Codex CLI     →  keep as AGENTS.md',
    ].join('\n'),
    'Before working with an AI agent',
  )

  const cd = outDir !== process.cwd() ? `  cd ${targetDir}\n` : ''
  p.outro(
    `Next steps:\n\n` +
    `${cd}` +
    `  mv AGENTS.md CLAUDE.md        # or whichever applies\n` +
    `  cp .env.example .env\n` +
    `  # Edit .env with DOTBEP_TOKEN and DOTBEP_BEP_ID\n` +
    `  npm install\n` +
    `  npm run pull`,
  )
}

async function silentMode() {
  const outDir      = resolve('.')
  const projectName = basename(outDir)
  scaffold(outDir)
  console.log(`create-dotbep-runtime: scaffolded "${projectName}"`)
  console.log('Next steps:')
  console.log('  mv AGENTS.md CLAUDE.md        # or whichever applies')
  console.log('  cp .env.example .env')
  console.log('  # Edit .env with DOTBEP_TOKEN and DOTBEP_BEP_ID')
  console.log('  npm install')
  console.log('  npm run pull')
}

function scaffold(outDir: string): void {
  copyDir(templateDir, outDir)
  const tmp = join(outDir, '_gitignore')
  if (existsSync(tmp)) renameSync(tmp, join(outDir, '.gitignore'))
}

function copyDir(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src)) {
    const srcPath  = join(src, entry)
    const destPath = join(dest, entry)
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      mkdirSync(dirname(destPath), { recursive: true })
      copyFileSync(srcPath, destPath)
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
