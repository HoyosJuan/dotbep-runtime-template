import * as esbuild from 'esbuild'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root      = join(__dirname, '..')

await esbuild.build({
  entryPoints: [join(root, 'src', 'runtime', 'index.ts')],
  bundle:      true,
  platform:    'node',
  format:      'cjs',
  external:    ['@dotbep/core'],
  outfile:     join(root, 'dist', 'runtime.cjs'),
  minify:      true,
  logLevel:    'silent',
})

console.log('Runtime built → dist/runtime.cjs')
