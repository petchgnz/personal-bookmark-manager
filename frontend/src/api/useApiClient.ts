import { useAuth0 } from '@auth0/auth0-react'
import { useMemo } from 'react'
import { getRuntimeConfig } from '../config/runtimeConfig'
import { createApiClient } from './apiClient'

export function useApiClient() {
  const { getAccessTokenSilently } = useAuth0()
  const { apiBaseUrl, auth0Audience } = getRuntimeConfig()
  return useMemo(
    () => createApiClient(apiBaseUrl, () => getAccessTokenSilently({ authorizationParams: { audience: auth0Audience } })),
    [apiBaseUrl, auth0Audience, getAccessTokenSilently],
  )
}
