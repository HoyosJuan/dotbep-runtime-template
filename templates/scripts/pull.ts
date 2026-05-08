import 'dotenv/config'
import { writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Bep } from '@dotbep/core'

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
