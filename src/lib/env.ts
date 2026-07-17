import 'dotenv/config'

export interface DotbepEnv {
  token:  string
  bepId:  string
  apiUrl: string
}

// Loads and validates the platform credentials from the CALLING project's
// .env (dotenv/config reads relative to process.cwd(), which is always the
// user's project root since npm scripts run with that cwd) — not from
// wherever this package itself is installed.
export function loadDotbepEnv(): DotbepEnv {
  const token  = process.env['DOTBEP_TOKEN']
  const bepId  = process.env['DOTBEP_BEP_ID']
  const apiUrl = process.env['DOTBEP_API_URL'] ?? 'https://app.dotbep.com/api'

  if (!token) throw new Error('DOTBEP_TOKEN is not set in .env')
  if (!bepId) throw new Error('DOTBEP_BEP_ID is not set in .env')

  return { token, bepId, apiUrl }
}
