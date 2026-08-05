import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useCollections,
  useCreateBookmark,
  useCreateCollection,
  useReplaceBookmark,
  useUpdateCollection,
} from '../api/resourceQueries';
import type { Bookmark } from '../api/resourceTypes';
import { BookmarkFormDialog } from './BookmarkFormDialog';
import { CollectionFormDialog } from './CollectionFormDialog';

vi.mock('../api/resourceQueries', () => ({
  useCollections: vi.fn(),
  useCreateBookmark: vi.fn(),
  useCreateCollection: vi.fn(),
  useReplaceBookmark: vi.fn(),
  useUpdateCollection: vi.fn(),
}));

function createMutation() {
  return {
    mutate: vi.fn(),
    reset: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  };
}

describe('edit form dialogs', () => {
  const createCollection = createMutation();
  const updateCollection = createMutation();
  const createBookmark = createMutation();
  const replaceBookmark = createMutation();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCollections).mockReturnValue({
      data: {
        data: [{ id: 'collection-id', name: 'Reading' }],
      },
      isPending: false,
      isError: false,
    } as never);
    vi.mocked(useCreateCollection).mockReturnValue(createCollection as never);
    vi.mocked(useUpdateCollection).mockReturnValue(updateCollection as never);
    vi.mocked(useCreateBookmark).mockReturnValue(createBookmark as never);
    vi.mocked(useReplaceBookmark).mockReturnValue(replaceBookmark as never);
  });

  it('prefills and patches a changed collection name', async () => {
    const user = userEvent.setup();
    render(
      <CollectionFormDialog
        open
        collection={{ id: 'collection-id', name: 'Reading' }}
        onClose={vi.fn()}
      />,
    );

    const name = screen.getByLabelText('Name');
    expect(name).toHaveValue('Reading');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    await user.clear(name);
    await user.type(name, 'Research');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(updateCollection.mutate).toHaveBeenCalledWith(
      { id: 'collection-id', name: 'Research' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(createCollection.mutate).not.toHaveBeenCalled();
  });

  it('prefills and puts every editable bookmark field', async () => {
    const user = userEvent.setup();
    const bookmark: Bookmark = {
      id: 'bookmark-id',
      url: 'https://example.com',
      title: 'Example',
      notes: 'Original note',
      collectionId: 'collection-id',
      ownerId: 'owner-id',
      createdAt: '2026-08-05T00:00:00.000Z',
      updatedAt: '2026-08-05T00:00:00.000Z',
    };
    render(<BookmarkFormDialog open bookmark={bookmark} onClose={vi.fn()} />);

    expect(screen.getByLabelText(/URL/)).toHaveValue(bookmark.url);
    expect(screen.getByLabelText(/Title/)).toHaveValue(bookmark.title);
    expect(screen.getByLabelText('Notes')).toHaveValue(bookmark.notes);
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    await user.clear(screen.getByLabelText(/Title/));
    await user.type(screen.getByLabelText(/Title/), 'Updated example');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(replaceBookmark.mutate).toHaveBeenCalledWith(
      {
        id: bookmark.id,
        input: {
          url: bookmark.url,
          title: 'Updated example',
          notes: bookmark.notes,
          collectionId: bookmark.collectionId,
        },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(createBookmark.mutate).not.toHaveBeenCalled();
  });
});
