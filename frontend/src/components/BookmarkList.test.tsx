import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { Bookmark } from '../api/resourceTypes'
import { BookmarkList } from './BookmarkList'

const bookmark: Bookmark = {
  id: 'bookmark-id', url: 'https://example.com/article', title: 'Useful article', notes: 'Read later', collectionId: null,
  ownerId: 'owner-id', createdAt: '2026-08-05T00:00:00.000Z', updatedAt: '2026-08-05T00:00:00.000Z',
}

describe('BookmarkList', () => {
  it('renders safe external links and an uncategorised state', () => {
    render(<MemoryRouter><BookmarkList bookmarks={[bookmark]} onDelete={vi.fn()} /></MemoryRouter>)
    const link = screen.getByRole('link', { name: bookmark.url })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText('Uncategorised')).toBeInTheDocument()
  })

  it('requests confirmation instead of deleting immediately', async () => {
    const onDelete = vi.fn()
    render(<MemoryRouter><BookmarkList bookmarks={[bookmark]} onDelete={onDelete} /></MemoryRouter>)
    screen.getByRole('button', { name: 'Delete' }).click()
    expect(onDelete).toHaveBeenCalledWith(bookmark)
  })
})
