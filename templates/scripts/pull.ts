import 'dotenv/config'
import { writeFile, readFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Bep } from '@dotbep/core'
import type { RemoteData } from '@dotbep/core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root      = join(__dirname, '..')

const token  = process.env['DOTBEP_TOKEN']
const bepId  = process.env['DOTBEP_BEP_ID']
const apiUrl = process.env['DOTBEP_API_URL'] ?? 'https://app.dotbep.com/api'

if (!token) throw new Error('DOTBEP_TOKEN is not set in .env')
if (!bepId) throw new Error('DOTBEP_BEP_ID is not set in .env')

console.log(`Downloading BEP ${bepId}...`)

const res = await fetch(`${apiUrl}/beps/${bepId}/file`, {
  headers: { Authorization: `Bearer ${token}` },
})
if (!res.ok) throw new Error(`Failed to download BEP: ${res.statusText}`)

const bep   = await Bep.open(new Uint8Array(await res.arrayBuffer()))
const types = bep.generateRuntimeTypes()
const out   = join(root, 'src', 'bep.d.ts')

await mkdir(dirname(out), { recursive: true })
await writeFile(out, types, 'utf8')

console.log(`Types written to src/bep.d.ts`)
console.log(`  BEP: ${bep.project.get()?.name ?? bepId}`)

// ─── Kit assets ───────────────────────────────────────────────────────────────

const kitBase = 'https://app.dotbep.com/_kit'

async function downloadSdkAsset(url: string, dest: string, label: string) {
  const r = await fetch(url)
  if (!r.ok) { console.warn(`  Warning: could not download ${label} (${r.statusText})`); return }
  await mkdir(dirname(dest), { recursive: true })
  await writeFile(dest, await r.text(), 'utf8')
  console.log(`  ${label} → ${dest.replace(root + '/', '')}`)
}

await downloadSdkAsset(
  `${kitBase}/built-in-lenses.ts`,
  join(root, 'src', 'lenses', 'built-in.ts'),
  'built-in-lenses.ts',
)

await downloadSdkAsset(
  `${kitBase}/DESIGN.md`,
  join(root, 'DESIGN.md'),
  'DESIGN.md',
)

// ─── Lenses mappings ──────────────────────────────────────────────────────────

function generateMappings(remoteData: RemoteData[]): string {
  const entries = remoteData.map(r => {
    const comment = r.resolverId
      ? `  // ${r.name} — resolver: ${r.resolverId}`
      : `  // ${r.name}`
    return `${comment}\n  '${r.id}': [],`
  }).join('\n\n')

  return [
    '// src/lenses/mappings.ts — updated by `npm run pull`',
    '// For each remote data source, declare which lenses (and optional adapters) can display it.',
    '// Adapter IDs must match named exports from src/lenses/index.ts.',
    '//',
    '// Example entry:',
    "//   'resolver-id': [",
    "//     { lens: 'dotbep:table' },",
    "//     { lens: 'my-lens', adapter: 'myAdapter' },",
    '//   ],',
    '',
    'export default {',
    entries,
    '}',
    '',
  ].join('\n')
}

const mappingsPath = join(root, 'src', 'lenses', 'mappings.ts')
const remoteData   = bep.remoteData.list()

let existingContent: string | null = null
try { existingContent = await readFile(mappingsPath, 'utf8') } catch {}

if (!existingContent) {
  await mkdir(dirname(mappingsPath), { recursive: true })
  await writeFile(mappingsPath, generateMappings(remoteData), 'utf8')
  console.log('  mappings.ts → src/lenses/mappings.ts')
} else {
  const missing = remoteData.filter(r => !existingContent!.includes(r.id))
  if (missing.length > 0) {
    const newLines = missing.map(r => {
      const comment = r.resolverId
        ? `\n  // ${r.name} — resolver: ${r.resolverId}`
        : `\n  // ${r.name}`
      return `${comment}\n  '${r.id}': [],`
    }).join('\n')
    const updated = existingContent.replace(/(\n}\s*$)/, newLines + '\n}')
    await writeFile(mappingsPath, updated, 'utf8')
    console.log(`  mappings.ts — added ${missing.length} new entr${missing.length === 1 ? 'y' : 'ies'}`)
  } else {
    console.log('  mappings.ts — up to date')
  }
}
