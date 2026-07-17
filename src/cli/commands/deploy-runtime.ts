import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { loadDotbepEnv } from '../../lib/env.js'
import { buildRuntime } from './build-runtime.js'

export async function deployRuntime(): Promise<void> {
  const root = process.cwd()
  const { token, bepId, apiUrl } = loadDotbepEnv()

  await buildRuntime()

  const bundle = await readFile(join(root, 'dist', 'runtime.cjs'))

  console.log(`Deploying runtime to BEP ${bepId}...`)

  const form = new FormData()
  form.append('file', new Blob([bundle], { type: 'application/javascript' }), 'runtime.cjs')

  const res = await fetch(`${apiUrl}/beps/${bepId}/runtime`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}` },
    body:    form,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>
    throw new Error((err['error'] as string | undefined) ?? res.statusText)
  }

  console.log('Runtime deployed.')
}
