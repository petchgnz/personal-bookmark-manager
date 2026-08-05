import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApiClient } from './useApiClient'
import type { Bookmark, BookmarkFilters, BookmarkOverview, Collection, CreateBookmarkInput, PaginatedResponse } from './resourceTypes'

export const resourceKeys = {
  collections: ['collections'] as const,
  collection: (id: string) => ['collections', id] as const,
  bookmarks: ['bookmarks'] as const,
  bookmark: (id: string) => ['bookmarks', id] as const,
  overview: ['overview'] as const,
}

export function useBookmarkOverview() {
  const apiRequest = useApiClient()
  return useQuery({ queryKey: resourceKeys.overview, queryFn: () => apiRequest<BookmarkOverview>('/all') })
}

export function buildPageQuery(page: number, limit: number) {
  return new URLSearchParams({ page: String(page), limit: String(limit) }).toString()
}

export function buildBookmarkQuery(filters: BookmarkFilters) {
  const params = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) })
  if (filters.collectionId) params.set('collectionId', filters.collectionId)
  if (filters.uncategorised) params.set('uncategorised', 'true')
  return params.toString()
}

export function useCollections(page: number, limit: number) {
  const apiRequest = useApiClient()
  return useQuery({
    queryKey: [...resourceKeys.collections, { page, limit }],
    queryFn: () => apiRequest<PaginatedResponse<Collection>>(`/collections?${buildPageQuery(page, limit)}`),
  })
}

export function useCollection(id: string) {
  const apiRequest = useApiClient()
  return useQuery({ queryKey: resourceKeys.collection(id), queryFn: () => apiRequest<Collection>(`/collections/${id}`) })
}

export function useCreateCollection() {
  const apiRequest = useApiClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => apiRequest<Collection>('/collections', { method: 'POST', body: JSON.stringify({ name }) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: resourceKeys.collections })
      void queryClient.invalidateQueries({ queryKey: resourceKeys.overview })
    },
  })
}

export function useDeleteCollection() {
  const apiRequest = useApiClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/collections/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: resourceKeys.collections })
      void queryClient.invalidateQueries({ queryKey: resourceKeys.bookmarks })
      void queryClient.invalidateQueries({ queryKey: resourceKeys.overview })
    },
  })
}

export function useBookmarks(filters: BookmarkFilters) {
  const apiRequest = useApiClient()
  return useQuery({
    queryKey: [...resourceKeys.bookmarks, filters],
    queryFn: () => apiRequest<PaginatedResponse<Bookmark>>(`/bookmarks?${buildBookmarkQuery(filters)}`),
  })
}

export function useCollectionBookmarks(id: string, page: number, limit: number) {
  const apiRequest = useApiClient()
  return useQuery({
    queryKey: [...resourceKeys.collection(id), 'bookmarks', { page, limit }],
    queryFn: () => apiRequest<PaginatedResponse<Bookmark>>(`/collections/${id}/bookmarks?${buildPageQuery(page, limit)}`),
  })
}

export function useBookmark(id: string) {
  const apiRequest = useApiClient()
  return useQuery({ queryKey: resourceKeys.bookmark(id), queryFn: () => apiRequest<Bookmark>(`/bookmarks/${id}`) })
}

export function useCreateBookmark() {
  const apiRequest = useApiClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBookmarkInput) => apiRequest<Bookmark>('/bookmarks', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: resourceKeys.bookmarks })
      void queryClient.invalidateQueries({ queryKey: resourceKeys.collections })
      void queryClient.invalidateQueries({ queryKey: resourceKeys.overview })
    },
  })
}

export function useDeleteBookmark() {
  const apiRequest = useApiClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/bookmarks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: resourceKeys.bookmarks })
      void queryClient.invalidateQueries({ queryKey: resourceKeys.collections })
      void queryClient.invalidateQueries({ queryKey: resourceKeys.overview })
    },
  })
}
