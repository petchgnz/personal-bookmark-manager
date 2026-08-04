import { useState } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { ApiError } from '../api/apiClient';
import {
  useCollection,
  useCollectionBookmarks,
  useDeleteBookmark,
  useDeleteCollection,
} from '../api/resourceQueries';
import type { Bookmark } from '../api/resourceTypes';
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

export function CollectionDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const collection = useCollection(id);
  const bookmarks = useCollectionBookmarks(id, page, pageSize);
  const deleteCollection = useDeleteCollection();
  const deleteBookmark = useDeleteBookmark();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bookmarkTarget, setBookmarkTarget] = useState<Bookmark | null>(null);

  if (collection.isPending)
    return <ResourceLoading label='Loading collection' />;
  if (collection.isError)
    return <ResourceError onRetry={() => void collection.refetch()} />;
  const deleteMessage =
    deleteCollection.error instanceof ApiError ?
      deleteCollection.error.message
    : 'Collection could not be deleted.';
  return (
    <Stack spacing={3}>
      <Button component={Link} to='/collections' className='self-start'>
        Back to collections
      </Button>
      <Stack direction='row' className='items-center justify-between gap-4'>
        <div>
          <Typography variant='h4'>{collection.data.name}</Typography>
          <Typography color='text.secondary'>
            Bookmarks in this collection
          </Typography>
        </div>
        <Stack direction='row' spacing={1}>
          <Button variant='contained' onClick={() => setCreateOpen(true)}>
            New bookmark
          </Button>
          <Button
            color='error'
            variant='outlined'
            onClick={() => setDeleteOpen(true)}
          >
            Delete collection
          </Button>
        </Stack>
      </Stack>
      {bookmarks.isPending && <ResourceLoading label='Loading bookmarks' />}
      {bookmarks.isError && (
        <ResourceError onRetry={() => void bookmarks.refetch()} />
      )}
      {bookmarks.data?.data.length === 0 && (
        <EmptyState
          title='This collection is empty'
          message='Add a bookmark to start using this collection.'
        />
      )}
      {bookmarks.data && bookmarks.data.data.length > 0 && (
        <>
          <BookmarkList
            bookmarks={bookmarks.data.data}
            onDelete={(bookmark) => {
              deleteBookmark.reset();
              setBookmarkTarget(bookmark);
            }}
          />
          <PaginationControls
            meta={bookmarks.data.meta}
            onChange={(nextPage) =>
              setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
            }
          />
        </>
      )}
      <BookmarkFormDialog
        open={createOpen}
        initialCollectionId={id}
        onClose={() => setCreateOpen(false)}
      />
      <DeleteConfirmationDialog
        open={deleteOpen}
        title='Delete collection?'
        message='Its bookmarks will remain available as uncategorised bookmarks.'
        isPending={deleteCollection.isPending}
        errorMessage={deleteCollection.isError ? deleteMessage : undefined}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() =>
          deleteCollection.mutate(id, {
            onSuccess: () => navigate('/collections'),
          })
        }
      />
      <DeleteConfirmationDialog
        open={Boolean(bookmarkTarget)}
        title='Delete bookmark?'
        message={`“${bookmarkTarget?.title ?? ''}” will be permanently deleted.`}
        isPending={deleteBookmark.isPending}
        errorMessage={
          deleteBookmark.isError ?
            deleteBookmark.error instanceof ApiError ?
              deleteBookmark.error.message
            : 'Bookmark could not be deleted.'
          : undefined
        }
        onCancel={() => setBookmarkTarget(null)}
        onConfirm={() =>
          bookmarkTarget &&
          deleteBookmark.mutate(bookmarkTarget.id, {
            onSuccess: () => setBookmarkTarget(null),
          })
        }
      />
    </Stack>
  );
}
