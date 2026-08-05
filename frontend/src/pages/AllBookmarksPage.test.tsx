import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBookmarkOverview } from '../api/resourceQueries';
import { AllBookmarksPage } from './AllBookmarksPage';

vi.mock('../api/resourceQueries', () => ({ useBookmarkOverview: vi.fn() }));

const bookmark = (id: string, title: string, collectionId: string | null) => ({
  id,
  title,
  url: `https://example.com/${id}`,
  notes: null,
  collectionId,
  ownerId: 'owner-id',
  createdAt: '2026-08-05T00:00:00.000Z',
  updatedAt: '2026-08-05T00:00:00.000Z',
});

describe('AllBookmarksPage', () => {
  beforeEach(() => {
    vi.mocked(useBookmarkOverview).mockReturnValue({
      data: {
        collections: [
          {
            id: 'collection-id',
            name: 'Engineering',
            ownerId: 'owner-id',
            createdAt: '2026-08-05T00:00:00.000Z',
            updatedAt: '2026-08-05T00:00:00.000Z',
            bookmarks: [bookmark('one', 'NestJS docs', 'collection-id')],
          },
          {
            id: 'empty-id',
            name: 'Empty collection',
            ownerId: 'owner-id',
            createdAt: '2026-08-05T00:00:00.000Z',
            updatedAt: '2026-08-05T00:00:00.000Z',
            bookmarks: [],
          },
        ],
        uncategorisedBookmarks: [bookmark('two', 'Prisma docs', null)],
      },
      isPending: false,
      isError: false,
    } as never);
  });

  it('renders grouped, empty, and uncategorised sections', () => {
    render(
      <MemoryRouter>
        <AllBookmarksPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('NestJS docs')).toBeInTheDocument();
    expect(screen.getByText('Empty collection')).toBeInTheDocument();
    expect(screen.getByText('0 bookmarks')).toBeInTheDocument();
    expect(screen.getByText('Uncategorised')).toBeInTheDocument();
    expect(screen.getByText('Prisma docs')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /NestJS docs/ })).toHaveAttribute(
      'href',
      '/bookmarks/one',
    );
  });

  it('shows an explicit empty state', () => {
    vi.mocked(useBookmarkOverview).mockReturnValue({
      data: { collections: [], uncategorisedBookmarks: [] },
      isPending: false,
      isError: false,
    } as never);

    render(
      <MemoryRouter>
        <AllBookmarksPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText('No bookmarks or collections yet'),
    ).toBeInTheDocument();
  });
});
