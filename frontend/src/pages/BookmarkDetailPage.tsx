import { useState } from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link, useNavigate, useParams } from 'react-router';
import { ApiError } from '../api/apiClient';
import { useBookmark, useDeleteBookmark } from '../api/resourceQueries';
import { DeleteConfirmationDialog } from '../components/DeleteConfirmationDialog';
import { ResourceError, ResourceLoading } from '../components/ResourceStates';

export function BookmarkDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const bookmark = useBookmark(id);
  const deleteBookmark = useDeleteBookmark();
  const [deleteOpen, setDeleteOpen] = useState(false);
  if (bookmark.isPending) return <ResourceLoading label='Loading bookmark' />;
  if (bookmark.isError)
    return <ResourceError onRetry={() => void bookmark.refetch()} />;
  const deleteMessage =
    deleteBookmark.error instanceof ApiError ?
      deleteBookmark.error.message
    : 'Bookmark could not be deleted.';
  return (
    <Stack spacing={3}>
      <Button component={Link} to='/bookmarks' className='self-start'>
        Back to bookmarks
      </Button>
      <Card variant='outlined'>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant='h4'>{bookmark.data.title}</Typography>
            <Typography
              component='a'
              href={bookmark.data.url}
              target='_blank'
              rel='noopener noreferrer'
              color='primary'
              className='break-all'
            >
              {bookmark.data.url}
            </Typography>
            {bookmark.data.notes ?
              <Typography className='whitespace-pre-wrap'>
                {bookmark.data.notes}
              </Typography>
            : <Typography color='text.secondary'>No notes</Typography>}
            <Typography variant='caption' color='text.secondary'>
              {bookmark.data.collectionId ? 'In a collection' : 'Uncategorised'}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
      <Button
        color='error'
        variant='outlined'
        className='self-start'
        onClick={() => setDeleteOpen(true)}
      >
        Delete bookmark
      </Button>
      <DeleteConfirmationDialog
        open={deleteOpen}
        title='Delete bookmark?'
        message={`“${bookmark.data.title}” will be permanently deleted.`}
        isPending={deleteBookmark.isPending}
        errorMessage={deleteBookmark.isError ? deleteMessage : undefined}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() =>
          deleteBookmark.mutate(id, { onSuccess: () => navigate('/bookmarks') })
        }
      />
    </Stack>
  );
}
