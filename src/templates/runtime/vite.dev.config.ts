// Local dev-only harness: previews custom lenses connected to real remote data,
// mirroring what the platform does at render time. Does NOT touch src/runtime or
// src/lenses — this config + the dev/ folder are a layer on top of the untouched
// runtime and lenses code.
import 'dotenv/config'
import { defineConfig } from 'vite'
import type { Plugin, ViteDevServer } from 'vite'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { readFile } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))

interface LensMapping {
  lens:     string
  adapter?: string
  default?: boolean
}

interface RemoteDataEntry {
  id:           string
  name:         string
  description?: string
  url:          string
  resolverId?:  string
}

interface RemoteDataCatalog {
  project:    string | null
  remoteData: RemoteDataEntry[]
}

// Snapshot written by `npm run pull` (scripts/pull.ts) — avoids downloading and
// parsing the full .bep on every request just to know what remote data exists.
// Re-run `npm run pull` whenever remote data changes on the platform.
async function loadRemoteDataCatalog(): Promise<RemoteDataCatalog> {
  const path = resolve(__dirname, 'src/lenses/remote-data.json')
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch {
    throw new Error('src/lenses/remote-data.json not found — run `npm run pull` first.')
  }
  return JSON.parse(raw) as RemoteDataCatalog
}

async function loadMappings(server: ViteDevServer): Promise<Record<string, LensMapping[]>> {
  const mod = await server.ssrLoadModule(resolve(__dirname, 'src/lenses/mappings.ts'))
  return (mod.default ?? {}) as Record<string, LensMapping[]>
}

function devApiPlugin(): Plugin {
  return {
    name: 'dotbep-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) { next(); return }
        const url = new URL(req.url, 'http://localhost')

        try {
          if (url.pathname === '/api/catalog') {
            const catalog  = await loadRemoteDataCatalog()
            const mappings = await loadMappings(server)
            const remoteData = catalog.remoteData.map(rd => ({
              ...rd,
              mappings: mappings[rd.id] ?? [],
            }))
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ project: catalog.project, remoteData }))
            return
          }

          if (url.pathname === '/api/resolve') {
            const remoteDataId = url.searchParams.get('remoteDataId')
            if (!remoteDataId) { res.statusCode = 400; res.end('Missing remoteDataId'); return }

            const catalog = await loadRemoteDataCatalog()
            const rd = catalog.remoteData.find(r => r.id === remoteDataId)
            if (!rd) { res.statusCode = 404; res.end('Remote data not found'); return }
            if (!rd.resolverId) { res.statusCode = 422; res.end('Remote data has no resolver'); return }

            const runtimeMod = await server.ssrLoadModule(resolve(__dirname, 'src/runtime/index.ts'))
            const BepRuntime = runtimeMod.default
            const runtime = new BepRuntime({ env: process.env })
            const data = await runtime._runResolver(rd.resolverId, rd.url)

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ data }))
            return
          }
        } catch (e) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }))
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  root: resolve(__dirname, 'dev'),
  server: {
    fs: { allow: [resolve(__dirname)] },
  },
  plugins: [devApiPlugin()],
})
