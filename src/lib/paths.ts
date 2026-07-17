import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// This file always ends up at <package-root>/dist/lib/paths.js, so climbing
// two levels (dist/lib -> dist -> package root) is a fixed, one-time
// calculation — every other module imports the result instead of redoing it.
export const packageRoot = join(__dirname, '..', '..')

// The scaffold — copied verbatim into a new project by `dotbep create`.
export const scaffoldDir = join(packageRoot, 'src', 'templates', 'runtime')
