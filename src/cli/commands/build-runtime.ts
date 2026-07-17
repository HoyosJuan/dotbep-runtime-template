import * as esbuild from 'esbuild'
import { join } from 'node:path'

export async function buildRuntime(): Promise<void> {
  const root = process.cwd()

  await esbuild.build({
    entryPoints: [join(root, 'src', 'runtime', 'index.ts')],
    bundle:      true,
    platform:    'node',
    format:      'cjs',

    outfile:     join(root, 'dist', 'runtime.cjs'),
    minify:      true,
    logLevel:    'silent',
  })

  console.log('Runtime built → dist/runtime.cjs')
}
