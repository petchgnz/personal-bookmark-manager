import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useBookmark,
  useCollection,
  useCollectionBookmarks,
  useCollections,
  useCreateBookmark,
  useCreateCollection,
  useDeleteBookmark,
  useDeleteCollection,
  useReplaceBookmark,
  useUpdateCollection,
} from '../api/resourceQueries';
import type { Bookmark, Collection } from '../api/resourceTypes';
import { BookmarkDetailPage } from './BookmarkDetailPage';
import { CollectionDetailPage } from './CollectionDetailPage';

vi.mock('../api/resourceQueries', () => ({
  useBookmark: vi.fn(),
  useCollection: vi.fn(),
  useCollectionBookmarks: vi.fn(),
  useCollections: vi.fn(),
  useCreateBookmark: vi.fn(),
  useCreateCollection: vi.fn(),
  useDeleteBookmark: vi.fn(),
  useDeleteCollection: vi.fn(),
  useReplaceBookmark: vi.fn(),
  useUpdateCollection: vi.fn(),
}));

const mutation = {
  mutate: vi.fn(),
  reset: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
};

const collection: Collection = {
  id: 'collection-id',
  name: 'Reading',
  ownerId: 'owner-id',
  createdAt: '2026-08-05T00:00:00.000Z',
  updatedAt: '2026-08-05T00:00:00.000Z',
};

const bookmark: Bookmark = {
  id: 'bookmark-id',
  url: 'https://example.com',
  title: 'Example',
  notes: 'A note',
  collectionId: collection.id,
  ownerId: 'owner-id',
  createdAt: '2026-08-05T00:00:00.000Z',
  updatedAt: '2026-08-05T00:00:00.000Z',
};

describe('detail edit flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCollection).mockReturnValue({
      data: collection,
      isPending: false,
      isError: false,
    } as never);
    vi.mocked(useCollectionBookmarks).mockReturnValue({
      data: {
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      },
      isPending: false,
      isError: false,
    } as never);
    vi.mocked(useBookmark).mockReturnValue({
      data: bookmark,
      isPending: false,
      isError: false,
    } as never);
    vi.mocked(useCollections).mockReturnValue({
      data: { data: [collection] },
      isPending: false,
      isError: false,
    } as never);
    vi.mocked(useCreateBookmark).mockReturnValue(mutation as never);
    vi.mocked(useCreateCollection).mockReturnValue(mutation as never);
    vi.mocked(useDeleteBookmark).mockReturnValue(mutation as never);
    vi.mocked(useDeleteCollection).mockReturnValue(mutation as never);
    vi.mocked(useReplaceBookmark).mockReturnValue(mutation as never);
    vi.mocked(useUpdateCollection).mockReturnValue(mutation as never);
  });

  it('opens collection edit from the collection detail page', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/collections/collection-id']}>
        <Routes>
          <Route path='/collections/:id' element={<CollectionDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Edit collection' }));

    expect(screen.getByRole('dialog')).toHaveTextContent('Edit collection');
    expect(screen.getByLabelText('Name')).toHaveValue(collection.name);
  });

  it('opens bookmark edit from the bookmark detail page', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/bookmarks/bookmark-id']}>
        <Routes>
          <Route path='/bookmarks/:id' element={<BookmarkDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Edit bookmark' }));

    expect(screen.getByRole('dialog')).toHaveTextContent('Edit bookmark');
    expect(screen.getByLabelText(/Title/)).toHaveValue(bookmark.title);
  });
});
