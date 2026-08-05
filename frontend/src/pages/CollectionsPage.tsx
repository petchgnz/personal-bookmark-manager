import { type FormEvent, useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Link, useSearchParams } from 'react-router';
import { ApiError } from '../api/apiClient';
import { useCollections, useDeleteCollection } from '../api/resourceQueries';
import type { Collection } from '../api/resourceTypes';
import { CollectionFormDialog } from '../components/CollectionFormDialog';
import { DeleteConfirmationDialog } from '../components/DeleteConfirmationDialog';
import { PaginationControls } from '../components/PaginationControls';
import {
  EmptyState,
  ResourceError,
  ResourceLoading,
} from '../components/ResourceStates';

const pageSize = 20;

export function CollectionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const search = searchParams.get('search')?.trim() ?? '';
  const [searchInput, setSearchInput] = useState(search);
  const collections = useCollections(page, pageSize, search || undefined);
  const deleteCollection = useDeleteCollection();
  const [createOpen, setCreateOpen] = useState(false);
  const [target, setTarget] = useState<Collection | null>(null);
  const deleteMessage =
    deleteCollection.error instanceof ApiError ?
      deleteCollection.error.message
    : 'Collection could not be deleted.';

  const confirmDelete = () =>
    target &&
    deleteCollection.mutate(target.id, { onSuccess: () => setTarget(null) });

  useEffect(() => setSearchInput(search), [search]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const trimmedSearch = searchInput.trim();
    const next = new URLSearchParams(searchParams);
    next.delete('page');
    if (trimmedSearch) next.set('search', trimmedSearch);
    else next.delete('search');
    setSearchParams(next);
  };

  return (
    <Stack spacing={3}>
      <Stack direction='row' className='items-center justify-between gap-4'>
        <div>
          <Typography variant='h4'>Collections</Typography>
          <Typography color='text.secondary'>
            Organise your private bookmarks.
          </Typography>
        </div>
        <Button variant='contained' onClick={() => setCreateOpen(true)}>
          New collection
        </Button>
      </Stack>
      <Paper
        component='section'
        variant='outlined'
        className='rounded-2xl border-slate-200 bg-white p-4 shadow-sm md:p-5'
      >
        <Stack spacing={2}>
          <div>
            <Typography variant='subtitle1' className='font-semibold'>
              Find collections
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Filter your private collections by name.
            </Typography>
          </div>
          <Stack component='form' spacing={1} onSubmit={submitSearch}>
            <Typography
              component='label'
              htmlFor='collection-search'
              variant='body2'
              className='font-medium text-slate-700'
            >
              Search collections
            </Typography>
            <div className='flex flex-col gap-2 sm:flex-row'>
              <TextField
                id='collection-search'
                placeholder='Search by collection name'
                value={searchInput}
                size='small'
                className='grow'
                slotProps={{
                  input: { className: 'h-10' },
                  htmlInput: { maxLength: 120 },
                }}
                onChange={(event) => setSearchInput(event.target.value)}
              />
              <Button
                type='submit'
                variant='contained'
                className='h-10 shrink-0 sm:min-w-28'
              >
                Search
              </Button>
              {search && (
                <Button
                  variant='text'
                  className='h-10 shrink-0'
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
            </div>
          </Stack>
        </Stack>
      </Paper>
      {collections.isPending && <ResourceLoading label='Loading collections' />}
      {collections.isError && (
        <ResourceError onRetry={() => void collections.refetch()} />
      )}
      {collections.data?.data.length === 0 && (
        <EmptyState
          title={search ? 'No collections found' : 'No collections yet'}
          message={
            search ?
              `No collections match “${search}”.`
            : 'Create your first collection to organise bookmarks.'
          }
        />
      )}
      {collections.data && (
        <Stack spacing={2}>
          {collections.data.data.map((collection) => (
            <Card key={collection.id} variant='outlined'>
              <CardContent>
                <Typography variant='h6'>{collection.name}</Typography>
              </CardContent>
              <CardActions>
                <Button component={Link} to={`/collections/${collection.id}`}>
                  View
                </Button>
                <Button
                  color='error'
                  onClick={() => {
                    deleteCollection.reset();
                    setTarget(collection);
                  }}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          ))}
          <PaginationControls
            meta={collections.data.meta}
            onChange={(nextPage) => {
              const next = new URLSearchParams(searchParams);
              if (nextPage === 1) next.delete('page');
              else next.set('page', String(nextPage));
              setSearchParams(next);
            }}
          />
        </Stack>
      )}
      <CollectionFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <DeleteConfirmationDialog
        open={Boolean(target)}
        title='Delete collection?'
        message={`Bookmarks in “${target?.name ?? ''}” will remain available as uncategorised bookmarks.`}
        isPending={deleteCollection.isPending}
        errorMessage={deleteCollection.isError ? deleteMessage : undefined}
        onCancel={() => setTarget(null)}
        onConfirm={confirmDelete}
      />
    </Stack>
  );
}
