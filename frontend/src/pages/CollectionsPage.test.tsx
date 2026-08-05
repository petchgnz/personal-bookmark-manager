import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useCollections,
  useCreateCollection,
  useDeleteCollection,
  useUpdateCollection,
} from '../api/resourceQueries';
import { CollectionsPage } from './CollectionsPage';

vi.mock('../api/resourceQueries', () => ({
  useCollections: vi.fn(),
  useCreateCollection: vi.fn(),
  useDeleteCollection: vi.fn(),
  useUpdateCollection: vi.fn(),
}));

const collection = {
  id: 'collection-id',
  name: 'Engineering',
  ownerId: 'owner-id',
  createdAt: '2026-08-05T00:00:00.000Z',
  updatedAt: '2026-08-05T00:00:00.000Z',
};
const deleteMutation = {
  mutate: vi.fn(),
  reset: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
};
const createMutation = {
  mutate: vi.fn(),
  reset: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
};

describe('CollectionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCollections).mockReturnValue({
      data: {
        data: [collection],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
      isPending: false,
      isError: false,
    } as never);
    vi.mocked(useDeleteCollection).mockReturnValue(deleteMutation as never);
    vi.mocked(useCreateCollection).mockReturnValue(createMutation as never);
    vi.mocked(useUpdateCollection).mockReturnValue(createMutation as never);
  });

  it('renders collections and waits for confirmation before deletion', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CollectionsPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(deleteMutation.mutate).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Bookmarks in “Engineering” will remain available as uncategorised bookmarks.',
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(deleteMutation.mutate).toHaveBeenCalledWith(
      'collection-id',
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('shows an explicit empty state', () => {
    vi.mocked(useCollections).mockReturnValue({
      data: { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      isPending: false,
      isError: false,
    } as never);
    render(
      <MemoryRouter>
        <CollectionsPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('No collections yet')).toBeInTheDocument();
  });

  it('submits a trimmed name filter and resets pagination', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/collections?page=3']}>
        <CollectionsPage />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByRole('textbox', { name: 'Search collections' }),
      '  Engineering  ',
    );
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(useCollections).toHaveBeenLastCalledWith(1, 20, 'Engineering');
  });

  it('shows a filter-aware empty state', () => {
    vi.mocked(useCollections).mockReturnValue({
      data: { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      isPending: false,
      isError: false,
    } as never);
    render(
      <MemoryRouter initialEntries={['/collections?search=Engineering']}>
        <CollectionsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('No collections found')).toBeInTheDocument();
    expect(
      screen.getByText('No collections match “Engineering”.'),
    ).toBeInTheDocument();
  });
});
