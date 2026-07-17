interface LensMapping {
  lens:     string
  adapter?: string
  default?: boolean
}

interface CatalogEntry {
  id:           string
  name:         string
  description?: string
  resolverId?:  string
  mappings:     LensMapping[]
}

let mountedEl: HTMLElement | null = null

function setStatus(text: string | null, isError = false): void {
  const status = document.getElementById('status')!
  status.hidden = text === null
  status.textContent = text ?? ''
  status.classList.toggle('error', isError)
}

function clearMount(): void {
  mountedEl?.remove()
  mountedEl = null
}

async function showPreview(remoteDataId: string, lensTag: string, adapterName: string | null): Promise<void> {
  clearMount()
  setStatus(`Resolving data for ${remoteDataId}…`)

  const params = new URLSearchParams(location.search)
  params.set('remoteDataId', remoteDataId)
  params.set('lens', lensTag)
  if (adapterName) params.set('adapter', adapterName)
  else params.delete('adapter')
  history.pushState({}, '', `?${params.toString()}`)

  try {
    // Real lens component + adapter code, loaded straight from source — Vite transforms
    // it on the fly, same code that ships to the platform, untouched.
    const lensesModule = await import('../src/lenses/index.ts') as Record<string, unknown>

    const res = await fetch(`/api/resolve?remoteDataId=${encodeURIComponent(remoteDataId)}`)
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string }
      throw new Error(body.error ?? `Failed to resolve data (${res.status})`)
    }
    const { data: rawData } = await res.json() as { data: unknown }

    let data = rawData
    if (adapterName) {
      const adapter = lensesModule[adapterName]
      if (typeof adapter !== 'function') {
        throw new Error(`Adapter "${adapterName}" not found among src/lenses/index.ts exports.`)
      }
      data = (adapter as (input: unknown) => unknown)(rawData)
    }

    const el = document.createElement(lensTag) as HTMLElement & { data?: unknown }
    el.data = data
    document.getElementById('mount')!.append(el)
    mountedEl = el
    setStatus(null)
  } catch (e) {
    setStatus(e instanceof Error ? e.message : String(e), true)
  }
}

async function loadCatalog(): Promise<void> {
  const res = await fetch('/api/catalog')
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `Failed to load catalog (${res.status})`)
  }
  const { project, remoteData } = await res.json() as { project?: string; remoteData: CatalogEntry[] }

  document.getElementById('project-name')!.textContent = project ?? 'dotBEP project'

  const list = document.getElementById('catalog')!
  for (const rd of remoteData) {
    const li = document.createElement('li')
    li.className = 'catalog-item'

    const title = document.createElement('div')
    title.className = 'catalog-item-title'
    title.textContent = rd.name

    const desc = document.createElement('p')
    desc.className = 'catalog-item-desc'
    desc.textContent = rd.description ?? ''

    li.append(title, desc)

    if (rd.mappings.length === 0) {
      const empty = document.createElement('span')
      empty.className = 'tag tag-muted'
      empty.textContent = 'No lens mapped'
      li.append(empty)
    }

    for (const mapping of rd.mappings) {
      const isBuiltIn = mapping.lens.startsWith('dotbep:')
      const el = document.createElement(isBuiltIn ? 'span' : 'button')
      el.className = `tag ${isBuiltIn ? 'tag-muted' : 'tag-link'}`
      el.textContent = mapping.lens + (mapping.default ? ' (default)' : '')

      if (isBuiltIn) {
        el.title = 'Built-in platform lens — implementation lives in the platform, not in this repo, so it cannot be previewed here.'
      } else {
        (el as HTMLButtonElement).type = 'button'
        el.addEventListener('click', () => void showPreview(rd.id, mapping.lens, mapping.adapter ?? null))
      }

      li.append(el)
    }

    list.append(li)
  }

  // Deep-link support: restore selection from the URL on load (refresh/share-friendly).
  const params = new URLSearchParams(location.search)
  const remoteDataId = params.get('remoteDataId')
  const lensTag = params.get('lens')
  if (remoteDataId && lensTag) void showPreview(remoteDataId, lensTag, params.get('adapter'))
}

loadCatalog().catch(e => {
  document.body.innerHTML = `<pre class="hint error">${e instanceof Error ? e.message : String(e)}</pre>`
})
