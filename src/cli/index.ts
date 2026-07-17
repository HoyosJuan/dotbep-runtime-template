#!/usr/bin/env node
import { create } from './commands/create.js'
import { pull } from './commands/pull.js'
import { buildRuntime } from './commands/build-runtime.js'
import { buildLenses } from './commands/build-lenses.js'
import { deployRuntime } from './commands/deploy-runtime.js'
import { deployLenses } from './commands/deploy-lenses.js'

const [command, subcommand] = process.argv.slice(2)

async function main(): Promise<void> {
  switch (command) {
    case 'create':
      return create()
    case 'pull':
      return pull()
    case 'build':
      if (subcommand === 'runtime') return buildRuntime()
      if (subcommand === 'lenses')  return buildLenses()
      throw new Error(`Unknown build target "${subcommand}" — expected "runtime" or "lenses".`)
    case 'deploy':
      if (subcommand === 'runtime') return deployRuntime()
      if (subcommand === 'lenses')  return deployLenses()
      throw new Error(`Unknown deploy target "${subcommand}" — expected "runtime" or "lenses".`)
    default:
      console.log([
        'Usage: dotbep <command>',
        '',
        '  dotbep create           Scaffold a new dotbep runtime project',
        '  dotbep pull              Download BEP types and refresh generated files',
        '  dotbep build runtime     Bundle src/runtime/ -> dist/runtime.cjs',
        '  dotbep build lenses      Bundle src/lenses/ -> dist/lenses.js',
        '  dotbep deploy runtime    Build then upload the runtime to the BEP server',
        '  dotbep deploy lenses     Build then upload the lenses bundle',
      ].join('\n'))
      if (command) process.exitCode = 1
  }
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1) })
