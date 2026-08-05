import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useBookmarks,
  useCollections,
  useCreateBookmark,
  useDeleteBookmark,
} from '../api/resourceQueries';
import { BookmarksPage } from './BookmarksPage';

vi.mock('../api/resourceQueries', () => ({
  useBookmarks: vi.fn(),
  useCollections: vi.fn(),
  useCreateBookmark: vi.fn(),
  useDeleteBookmark: vi.fn(),
}));

const mutation = {
  mutate: vi.fn(),
  reset: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
};

describe('BookmarksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useBookmarks).mockReturnValue({
      data: { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      isPending: false,
      isError: false,
    } as never);
    vi.mocked(useCollections).mockReturnValue({
      data: {
        data: [{ id: 'collection-id', name: 'Reading' }],
        meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
      },
      isPending: false,
      isError: false,
    } as never);
    vi.mocked(useDeleteBookmark).mockReturnValue(mutation as never);
    vi.mocked(useCreateBookmark).mockReturnValue(mutation as never);
  });

  it('sends the explicit uncategorised filter and resets pagination', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/bookmarks?page=4']}>
        <BookmarksPage />
      </MemoryRouter>,
    );
    await user.click(screen.getByLabelText('Filter'));
    await user.click(screen.getByRole('option', { name: 'Uncategorised' }));
    expect(vi.mocked(useBookmarks)).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      uncategorised: true,
    });
  });

  it('shows a filter-aware empty state', () => {
    render(
      <MemoryRouter initialEntries={['/bookmarks?filter=collection-id']}>
        <BookmarksPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByText('There are no bookmarks matching this filter.'),
    ).toBeInTheDocument();
  });

  it('submits trimmed search with the active filter and resets pagination', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/bookmarks?filter=collection-id&page=3']}>
        <BookmarksPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Search bookmarks'), ' prisma docs ');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(vi.mocked(useBookmarks)).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      collectionId: 'collection-id',
      search: 'prisma docs',
    });
  });

  it('presents search as the primary action without a floating label', () => {
    render(
      <MemoryRouter initialEntries={['/bookmarks']}>
        <BookmarksPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Find bookmarks')).toBeInTheDocument();
    const searchInput = screen.getByLabelText('Search bookmarks');
    expect(searchInput).toHaveAttribute(
      'placeholder',
      'Search by title or notes',
    );
    expect(searchInput.parentElement).toHaveClass('h-10');
    expect(screen.getByRole('button', { name: 'Search' })).toHaveClass('h-10');
  });
});
