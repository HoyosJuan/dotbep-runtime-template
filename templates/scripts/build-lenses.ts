import * as esbuild from 'esbuild'
import { join, dirname } from 'node:path'
import { existsSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { z } from 'zod'

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

// ─── Manifest ─────────────────────────────────────────────────────────────────

const schemasPath  = join(root, 'src', 'lenses', 'schemas.ts')
const mappingsPath = join(root, 'src', 'lenses', 'mappings.ts')

const lenses:   Record<string, unknown> = {}
const mappings: Record<string, unknown> = {}

if (existsSync(schemasPath)) {
  try {
    const mod = await import(pathToFileURL(schemasPath).href)
    for (const [tag, entry] of Object.entries(mod as Record<string, { name: string; schema: z.ZodTypeAny }>)) {
      if (entry?.schema) {
        lenses[tag] = { name: entry.name, schema: z.toJSONSchema(entry.schema) }
      }
    }
  } catch {}
}

if (existsSync(mappingsPath)) {
  try {
    const mod = await import(pathToFileURL(mappingsPath).href)
    Object.assign(mappings, mod.default ?? mod)
  } catch {}
}

const manifest     = { version: 1, lenses, mappings }
const manifestPath = join(root, 'dist', 'lenses.manifest.json')
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
console.log('Manifest generated → dist/lenses.manifest.json')
