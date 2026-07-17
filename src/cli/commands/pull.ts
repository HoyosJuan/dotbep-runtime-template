import { writeFile, readFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { Bep } from '@dotbep/core'
import type { RemoteData } from '@dotbep/core'
import { loadDotbepEnv } from '../../lib/env.js'

export async function pull(): Promise<void> {
  const root = process.cwd()
  const { token, bepId, apiUrl } = loadDotbepEnv()

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

  // ─── Runtime meta ───────────────────────────────────────────────────────────
  // Stamps the BEP version this runtime was generated for. Committed alongside
  // the generated code so the runtime repo's own git history doubles as a
  // bundle history — recovering an old runtime for a given BEP version is a
  // manual `git checkout` + redeploy, not a platform feature.

  const bepVersion = await bep.history.current()
  const metaPath   = join(root, 'meta.json')

  await writeFile(metaPath, JSON.stringify({ bepVersion }, null, 2) + '\n', 'utf8')
  console.log(`  meta.json → bepVersion ${bepVersion}`)

  // ─── .env.example ───────────────────────────────────────────────────────────
  // Regenerated on every pull: the two fixed platform credentials, plus one
  // placeholder line per env var this BEP's handlers declare (BepEnv in
  // bep.d.ts). Never holds real values — this file is committed; real secrets
  // go in the gitignored .env, which the local dev server (npm run dev) also
  // reads so resolvers can run for real against your own test credentials.

  const envVars = bep.env.list()
  const envExampleLines = ['DOTBEP_TOKEN=dbk_...', 'DOTBEP_BEP_ID=...']

  if (envVars.length > 0) {
    envExampleLines.push('')
    for (const e of envVars) {
      envExampleLines.push(`# ${e.description}`)
      envExampleLines.push(`${e.key}=`)
    }
  }

  await writeFile(join(root, '.env.example'), envExampleLines.join('\n') + '\n', 'utf8')
  console.log(`  .env.example — ${envVars.length} BEP env var${envVars.length === 1 ? '' : 's'}`)

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

  // DESIGN.md is NOT downloaded here — not every pull touches lenses, and a runtime
  // may define its own DESIGN.md instead of the platform's. See "Custom lens design"
  // in RUNTIME.md: the agent fetches https://app.dotbep.com/_kit/DESIGN.md and reads
  // it in memory at lens-authoring time — never written to disk — unless a
  // runtime-owned DESIGN.md already exists at the repo root, which always wins.

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

  // ─── Remote data catalog (dev harness) ─────────────────────────────────────────
  // Snapshot of remote data metadata (name/description/url/resolverId), used by the
  // local dev server (npm run dev) so it never has to download and parse the full
  // .bep file just to know what remote data exists and which URL each resolver needs.

  const remoteDataCatalogPath = join(root, 'src', 'lenses', 'remote-data.json')
  const catalog = {
    project: bep.project.get()?.name ?? null,
    remoteData: remoteData.map(r => ({
      id:          r.id,
      name:        r.name,
      description: r.description,
      url:         r.url,
      resolverId:  r.resolverId,
    })),
  }

  await writeFile(remoteDataCatalogPath, JSON.stringify(catalog, null, 2) + '\n', 'utf8')
  console.log('  remote-data.json → src/lenses/remote-data.json')
}
