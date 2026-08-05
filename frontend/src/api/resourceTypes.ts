export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface Collection {
  id: string
  name: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface Bookmark {
  id: string
  url: string
  title: string
  notes: string | null
  collectionId: string | null
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface CreateBookmarkInput {
  url: string
  title: string
  notes?: string | null
  collectionId?: string | null
}

export interface BookmarkFilters {
  page: number
  limit: number
  collectionId?: string
  uncategorised?: true
  search?: string
}

export interface CollectionWithBookmarks extends Collection {
  bookmarks: Bookmark[]
}

export interface BookmarkOverview {
  collections: CollectionWithBookmarks[]
  uncategorisedBookmarks: Bookmark[]
}
