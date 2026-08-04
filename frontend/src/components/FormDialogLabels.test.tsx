import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useCollections,
  useCreateBookmark,
  useCreateCollection,
} from '../api/resourceQueries';
import { BookmarkFormDialog } from './BookmarkFormDialog';
import { CollectionFormDialog } from './CollectionFormDialog';

vi.mock('../api/resourceQueries', () => ({
  useCollections: vi.fn(),
  useCreateBookmark: vi.fn(),
  useCreateCollection: vi.fn(),
}));

const mutation = {
  mutate: vi.fn(),
  reset: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
};

describe('form dialog labels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCollections).mockReturnValue({
      data: { data: [] },
      isPending: false,
      isError: false,
    } as never);
    vi.mocked(useCreateBookmark).mockReturnValue(mutation as never);
    vi.mocked(useCreateCollection).mockReturnValue(mutation as never);
  });

  it('keeps the empty collection name label floating above the outline', () => {
    render(<CollectionFormDialog open onClose={vi.fn()} />);
    expect(screen.getByText('Name', { selector: 'label' })).toHaveAttribute(
      'data-shrink',
      'true',
    );
  });

  it('keeps empty URL and title labels floating above their outlines', () => {
    render(<BookmarkFormDialog open onClose={vi.fn()} />);
    expect(screen.getByText('URL', { selector: 'label' })).toHaveAttribute(
      'data-shrink',
      'true',
    );
    expect(screen.getByText('Title', { selector: 'label' })).toHaveAttribute(
      'data-shrink',
      'true',
    );
  });
});
