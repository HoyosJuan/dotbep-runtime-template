import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root      = join(__dirname, '..')

const token  = process.env['DOTBEP_TOKEN']
const bepId  = process.env['DOTBEP_BEP_ID']
const apiUrl = process.env['DOTBEP_API_URL'] ?? 'https://app.dotbep.com/api'

if (!token) throw new Error('DOTBEP_TOKEN is not set in .env')
if (!bepId) throw new Error('DOTBEP_BEP_ID is not set in .env')

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
