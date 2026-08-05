import { afterEach, describe, expect, it } from 'vitest'
import { getRuntimeConfig } from './runtimeConfig'

describe('getRuntimeConfig', () => {
  afterEach(() => {
    delete window.__APP_CONFIG__
  })

  it('returns trimmed public runtime configuration', () => {
    expect(getRuntimeConfig({
      VITE_AUTH0_DOMAIN: ' tenant.auth0.com ',
      VITE_AUTH0_CLIENT_ID: ' client-id ',
      VITE_AUTH0_AUDIENCE: ' https://api.test ',
      VITE_API_BASE_URL: ' http://localhost:3001/ ',
    })).toEqual({
      auth0Domain: 'tenant.auth0.com',
      auth0ClientId: 'client-id',
      auth0Audience: 'https://api.test',
      apiBaseUrl: 'http://localhost:3001',
    })
  })

  it('fails closed when required configuration is missing', () => {
    expect(() => getRuntimeConfig({})).toThrow('Missing required frontend configuration: VITE_AUTH0_DOMAIN')
  })

  it('prefers container runtime values when no explicit environment is supplied', () => {
    window.__APP_CONFIG__ = {
      VITE_AUTH0_DOMAIN: 'runtime.auth0.com',
      VITE_AUTH0_CLIENT_ID: 'runtime-client',
      VITE_AUTH0_AUDIENCE: 'https://runtime-api',
      VITE_API_BASE_URL: 'https://runtime-app/api/',
    }

    expect(getRuntimeConfig()).toEqual({
      auth0Domain: 'runtime.auth0.com',
      auth0ClientId: 'runtime-client',
      auth0Audience: 'https://runtime-api',
      apiBaseUrl: 'https://runtime-app/api',
    })
  })
})
