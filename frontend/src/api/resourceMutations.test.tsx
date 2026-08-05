import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useApiClient } from './useApiClient';
import {
  resourceKeys,
  useReplaceBookmark,
  useUpdateCollection,
} from './resourceQueries';
import type { Bookmark, Collection } from './resourceTypes';

vi.mock('./useApiClient', () => ({ useApiClient: vi.fn() }));

function createWrapper(queryClient: QueryClient) {
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('resource edit mutations', () => {
  const apiRequest = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useApiClient).mockReturnValue(apiRequest);
  });

  it('patches a collection name and updates its detail cache', async () => {
    const collection: Collection = {
      id: 'collection-id',
      name: 'Updated collection',
      ownerId: 'owner-id',
      createdAt: '2026-08-05T00:00:00.000Z',
      updatedAt: '2026-08-05T01:00:00.000Z',
    };
    apiRequest.mockResolvedValue(collection);
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const { result } = renderHook(() => useUpdateCollection(), {
      wrapper: createWrapper(queryClient),
    });

    await act(() =>
      result.current.mutateAsync({
        id: collection.id,
        name: collection.name,
      }),
    );

    expect(apiRequest).toHaveBeenCalledWith('/collections/collection-id', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated collection' }),
    });
    expect(
      queryClient.getQueryData(resourceKeys.collection(collection.id)),
    ).toEqual(collection);
  });

  it('puts every editable bookmark field and updates its detail cache', async () => {
    const bookmark: Bookmark = {
      id: 'bookmark-id',
      url: 'https://example.com/updated',
      title: 'Updated bookmark',
      notes: null,
      collectionId: null,
      ownerId: 'owner-id',
      createdAt: '2026-08-05T00:00:00.000Z',
      updatedAt: '2026-08-05T01:00:00.000Z',
    };
    apiRequest.mockResolvedValue(bookmark);
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const { result } = renderHook(() => useReplaceBookmark(), {
      wrapper: createWrapper(queryClient),
    });
    const input = {
      url: bookmark.url,
      title: bookmark.title,
      notes: bookmark.notes,
      collectionId: bookmark.collectionId,
    };

    await act(() => result.current.mutateAsync({ id: bookmark.id, input }));

    expect(apiRequest).toHaveBeenCalledWith('/bookmarks/bookmark-id', {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    expect(
      queryClient.getQueryData(resourceKeys.bookmark(bookmark.id)),
    ).toEqual(bookmark);
  });
});
