import { describe, expect, it, vi } from 'vitest'
import { ApiError, createApiClient } from './apiClient'

describe('createApiClient', () => {
  it('attaches the SDK access token without persisting it', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(
      JSON.stringify({ id: 'user-id' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ))
    const getAccessToken = vi.fn().mockResolvedValue('access-token')
    const request = createApiClient('http://localhost:3000', getAccessToken, fetcher)

    await expect(request('/me')).resolves.toEqual({ id: 'user-id' })
    const [, init] = fetcher.mock.calls[0] ?? []
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer access-token')
    expect(getAccessToken).toHaveBeenCalledOnce()
    expect(window.localStorage).toHaveLength(0)
  })

  it('maps the safe API error contract', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      statusCode: 404,
      code: 'RESOURCE_NOT_FOUND',
      message: 'Collection not found',
    }), { status: 404, headers: { 'Content-Type': 'application/json' } }))
    const request = createApiClient('http://localhost:3000', () => Promise.resolve('token'), fetcher)

    await expect(request('/collections/missing')).rejects.toEqual(
      new ApiError(404, 'RESOURCE_NOT_FOUND', 'Collection not found'),
    )
  })

  it('does not expose malformed response content', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('database secret', { status: 500 }))
    const request = createApiClient('http://localhost:3000', () => Promise.resolve('token'), fetcher)

    await expect(request('/me')).rejects.toMatchObject({
      code: 'HTTP_ERROR',
      message: 'Request failed',
    })
  })
})
