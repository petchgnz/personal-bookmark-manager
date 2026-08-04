export interface RuntimeConfig {
  auth0Domain: string
  auth0ClientId: string
  auth0Audience: string
  apiBaseUrl: string
}

type Environment = Record<string, string | boolean | undefined>

function requireValue(environment: Environment, key: string): string {
  const value = environment[key]
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required frontend configuration: ${key}`)
  }
  return value.trim()
}

export function getRuntimeConfig(environment: Environment = import.meta.env): RuntimeConfig {
  return {
    auth0Domain: requireValue(environment, 'VITE_AUTH0_DOMAIN'),
    auth0ClientId: requireValue(environment, 'VITE_AUTH0_CLIENT_ID'),
    auth0Audience: requireValue(environment, 'VITE_AUTH0_AUDIENCE'),
    apiBaseUrl: requireValue(environment, 'VITE_API_BASE_URL').replace(/\/$/, ''),
  }
}
