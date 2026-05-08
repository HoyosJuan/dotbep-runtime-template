import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root      = join(__dirname, '..')

// Verify the bundle exists before attempting anything
await readFile(join(root, 'dist', 'lenses.js'))

// TODO: upload dist/lenses.js once the platform supports it.
// For now, upload the file manually from the platform UI.
console.log('Lenses deploy: upload dist/lenses.js manually from the platform.')
