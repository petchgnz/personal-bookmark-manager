import { useQuery } from '@tanstack/react-query'
import { useApiClient } from './useApiClient'

export interface CurrentUser {
  id: string
  email: string | null
  displayName: string | null
  createdAt: string
  updatedAt: string
}

export function useMe() {
  const apiRequest = useApiClient()
  return useQuery({ queryKey: ['me'], queryFn: () => apiRequest<CurrentUser>('/me') })
}
