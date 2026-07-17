import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { loadDotbepEnv } from '../../lib/env.js'
import { buildLenses } from './build-lenses.js'

export async function deployLenses(): Promise<void> {
  const root = process.cwd()
  const { token, bepId, apiUrl } = loadDotbepEnv()

  await buildLenses()

  const bundle   = await readFile(join(root, 'dist', 'lenses.js'))
  const manifest = await readFile(join(root, 'dist', 'lenses.manifest.json')).catch(() => null)

  console.log(`Deploying lenses to BEP ${bepId}...`)

  const form = new FormData()
  form.append('file', new Blob([bundle], { type: 'application/javascript' }), 'lenses.js')
  if (manifest) {
    form.append('manifest', new Blob([manifest], { type: 'application/json' }), 'lenses.manifest.json')
  }

  const res = await fetch(`${apiUrl}/beps/${bepId}/lenses`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}` },
    body:    form,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>
    throw new Error((err['error'] as string | undefined) ?? res.statusText)
  }

  console.log('Lenses deployed.')
}
