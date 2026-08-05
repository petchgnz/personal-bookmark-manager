export interface RuntimeConfig {
  auth0Domain: string
  auth0ClientId: string
  auth0Audience: string
  apiBaseUrl: string
}

type Environment = Record<string, string | boolean | undefined>

declare global {
  interface Window {
    __APP_CONFIG__?: Environment
  }
}

function requireValue(environment: Environment, key: string): string {
  const value = environment[key]
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required frontend configuration: ${key}`)
  }
  return value.trim()
}

function getEnvironment(): Environment {
  if (typeof window === 'undefined') return import.meta.env
  return { ...import.meta.env, ...window.__APP_CONFIG__ }
}

export function getRuntimeConfig(environment: Environment = getEnvironment()): RuntimeConfig {
  return {
    auth0Domain: requireValue(environment, 'VITE_AUTH0_DOMAIN'),
    auth0ClientId: requireValue(environment, 'VITE_AUTH0_CLIENT_ID'),
    auth0Audience: requireValue(environment, 'VITE_AUTH0_AUDIENCE'),
    apiBaseUrl: requireValue(environment, 'VITE_API_BASE_URL').replace(/\/$/, ''),
  }
}
