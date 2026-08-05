import { type FormEvent, useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useSearchParams } from 'react-router';
import { ApiError } from '../api/apiClient';
import {
  useBookmarks,
  useCollections,
  useDeleteBookmark,
} from '../api/resourceQueries';
import type { Bookmark, BookmarkFilters } from '../api/resourceTypes';
import { BookmarkFormDialog } from '../components/BookmarkFormDialog';
import { BookmarkList } from '../components/BookmarkList';
import { DeleteConfirmationDialog } from '../components/DeleteConfirmationDialog';
import { PaginationControls } from '../components/PaginationControls';
import {
  EmptyState,
  ResourceError,
  ResourceLoading,
} from '../components/ResourceStates';

const pageSize = 20;
const allCollectionsLimit = 100;

export function BookmarksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const filter = searchParams.get('filter') ?? 'all';
  const search = searchParams.get('search')?.trim() ?? '';
  const [searchInput, setSearchInput] = useState(search);
  const filters: BookmarkFilters = {
    page,
    limit: pageSize,
    ...(filter === 'uncategorised' ? { uncategorised: true }
    : filter === 'all' ? {}
    : { collectionId: filter }),
    ...(search ? { search } : {}),
  };
  const bookmarks = useBookmarks(filters);
  const collections = useCollections(1, allCollectionsLimit);
  const deleteBookmark = useDeleteBookmark();
  const [createOpen, setCreateOpen] = useState(false);
  const [target, setTarget] = useState<Bookmark | null>(null);
  const deleteMessage =
    deleteBookmark.error instanceof ApiError ?
      deleteBookmark.error.message
    : 'Bookmark could not be deleted.';

  useEffect(() => setSearchInput(search), [search]);

  const setFilter = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete('page');
    if (value === 'all') next.delete('filter');
    else next.set('filter', value);
    setSearchParams(next);
  };
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    const trimmedSearch = searchInput.trim();
    next.delete('page');
    if (trimmedSearch) next.set('search', trimmedSearch);
    else next.delete('search');
    setSearchParams(next);
  };
  return (
    <Stack spacing={3}>
      <Stack direction='row' className='items-center justify-between gap-4'>
        <div>
          <Typography variant='h4'>Bookmarks</Typography>
          <Typography color='text.secondary'>
            All your saved links in one private place.
          </Typography>
        </div>
        <Button variant='contained' onClick={() => setCreateOpen(true)}>
          New bookmark
        </Button>
      </Stack>
      <Stack direction='row' className='flex-wrap items-start gap-3'>
        <TextField
          select
          label='Filter'
          value={filter}
          className='min-w-64'
          onChange={(event) => setFilter(event.target.value)}
        >
          <MenuItem value='all'>All bookmarks</MenuItem>
          <MenuItem value='uncategorised'>Uncategorised</MenuItem>
          {collections.data?.data.map((collection) => (
            <MenuItem key={collection.id} value={collection.id}>
              {collection.name}
            </MenuItem>
          ))}
        </TextField>
        <Stack
          component='form'
          direction='row'
          className='min-w-72 grow gap-2'
          onSubmit={submitSearch}
        >
          <TextField
            label='Search bookmarks'
            value={searchInput}
            className='grow'
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { maxLength: 200 },
            }}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <Button type='submit' variant='outlined'>
            Search
          </Button>
          {search && (
            <Button
              onClick={() => {
                setSearchInput('');
                const next = new URLSearchParams(searchParams);
                next.delete('search');
                next.delete('page');
                setSearchParams(next);
              }}
            >
              Clear
            </Button>
          )}
        </Stack>
      </Stack>
      {bookmarks.isPending && <ResourceLoading label='Loading bookmarks' />}
      {bookmarks.isError && (
        <ResourceError onRetry={() => void bookmarks.refetch()} />
      )}
      {bookmarks.data?.data.length === 0 && (
        <EmptyState
          title='No bookmarks found'
          message={
            search ? `No bookmarks match “${search}”.`
            : filter === 'all' ?
              'Save your first bookmark to see it here.'
            : 'There are no bookmarks matching this filter.'
          }
        />
      )}
      {bookmarks.data && bookmarks.data.data.length > 0 && (
        <>
          <BookmarkList
            bookmarks={bookmarks.data.data}
            onDelete={(bookmark) => {
              deleteBookmark.reset();
              setTarget(bookmark);
            }}
          />
          <PaginationControls
            meta={bookmarks.data.meta}
            onChange={(nextPage) => {
              const next = new URLSearchParams(searchParams);
              if (nextPage === 1) next.delete('page');
              else next.set('page', String(nextPage));
              setSearchParams(next);
            }}
          />
        </>
      )}
      <BookmarkFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <DeleteConfirmationDialog
        open={Boolean(target)}
        title='Delete bookmark?'
        message={`“${target?.title ?? ''}” will be permanently deleted.`}
        isPending={deleteBookmark.isPending}
        errorMessage={deleteBookmark.isError ? deleteMessage : undefined}
        onCancel={() => setTarget(null)}
        onConfirm={() =>
          target &&
          deleteBookmark.mutate(target.id, { onSuccess: () => setTarget(null) })
        }
      />
    </Stack>
  );
}
