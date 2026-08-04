export interface ApiErrorBody {
  statusCode: number
  code: string
  message: string
  details?: Array<{ field: string; issue: string }>
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: ApiErrorBody['details']

  constructor(
    status: number,
    code: string,
    message: string,
    details?: ApiErrorBody['details'],
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

type GetAccessToken = () => Promise<string>
type Fetcher = typeof fetch

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null) return false
  const body = value as Record<string, unknown>
  return typeof body.statusCode === 'number' && typeof body.code === 'string' && typeof body.message === 'string'
}

export function createApiClient(baseUrl: string, getAccessToken: GetAccessToken, fetcher: Fetcher = fetch) {
  return async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
    const accessToken = await getAccessToken()
    const headers = new Headers(init.headers)
    headers.set('Authorization', `Bearer ${accessToken}`)
    if (init.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

    const response = await fetcher(`${baseUrl}${path}`, { ...init, headers })
    if (response.status === 204) return undefined as T

    const body: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      if (isApiErrorBody(body)) {
        throw new ApiError(response.status, body.code, body.message, body.details)
      }
      throw new ApiError(response.status, 'HTTP_ERROR', 'Request failed')
    }
    return body as T
  }
}
