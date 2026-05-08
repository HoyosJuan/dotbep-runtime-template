import * as esbuild from 'esbuild'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root      = join(__dirname, '..')

await esbuild.build({
  entryPoints: [join(root, 'src', 'lenses', 'index.ts')],
  bundle:      true,
  platform:    'browser',
  format:      'esm',
  outfile:     join(root, 'dist', 'lenses.js'),
  minify:      true,
  logLevel:    'silent',
})

console.log('Lenses built → dist/lenses.js')
