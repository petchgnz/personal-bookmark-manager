import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { ApiError } from '../api/apiClient';
import {
  useCollections,
  useCreateBookmark,
  useReplaceBookmark,
} from '../api/resourceQueries';
import type { Bookmark } from '../api/resourceTypes';

const collectionLimit = 100;

export function BookmarkFormDialog({
  open,
  initialCollectionId,
  bookmark,
  onClose,
}: {
  open: boolean;
  initialCollectionId?: string;
  bookmark?: Bookmark;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(bookmark?.url ?? '');
  const [title, setTitle] = useState(bookmark?.title ?? '');
  const [notes, setNotes] = useState(bookmark?.notes ?? '');
  const [collectionId, setCollectionId] = useState(
    bookmark?.collectionId ?? initialCollectionId ?? '',
  );
  const collections = useCollections(1, collectionLimit);
  const createBookmark = useCreateBookmark();
  const replaceBookmark = useReplaceBookmark();
  const isEditing = bookmark !== undefined;
  const activeMutation = isEditing ? replaceBookmark : createBookmark;

  useEffect(() => {
    if (!open) return;
    setUrl(bookmark?.url ?? '');
    setTitle(bookmark?.title ?? '');
    setNotes(bookmark?.notes ?? '');
    setCollectionId(bookmark?.collectionId ?? initialCollectionId ?? '');
  }, [bookmark, initialCollectionId, open]);

  const resetAndClose = () => {
    setUrl(bookmark?.url ?? '');
    setTitle(bookmark?.title ?? '');
    setNotes(bookmark?.notes ?? '');
    setCollectionId(bookmark?.collectionId ?? initialCollectionId ?? '');
    createBookmark.reset();
    replaceBookmark.reset();
    onClose();
  };

  const handleClose = () => {
    if (!activeMutation.isPending) resetAndClose();
  };

  const input = {
    url: url.trim(),
    title: title.trim(),
    notes: notes.trim() || null,
    collectionId: collectionId || null,
  };
  const isDirty =
    bookmark === undefined ||
    input.url !== bookmark.url ||
    input.title !== bookmark.title ||
    input.notes !== bookmark.notes ||
    input.collectionId !== bookmark.collectionId;

  const submit = () => {
    if (bookmark) {
      replaceBookmark.mutate(
        { id: bookmark.id, input },
        { onSuccess: resetAndClose },
      );
    } else {
      createBookmark.mutate(input, { onSuccess: resetAndClose });
    }
  };

  const isValid = input.url.length > 0 && input.title.length > 0;
  const message =
    activeMutation.error instanceof ApiError ?
      activeMutation.error.message
    : `Bookmark could not be ${isEditing ? 'updated' : 'created'}.`;
  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth='sm'>
      <DialogTitle>
        {isEditing ? 'Edit bookmark' : 'Create bookmark'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} className='pt-2'>
          <TextField
            autoFocus
            required
            label='URL'
            type='url'
            value={url}
            slotProps={{
              inputLabel: { shrink: true },
              input: { notched: true },
              htmlInput: { maxLength: 2048 },
            }}
            onChange={(event) => setUrl(event.target.value)}
          />
          <TextField
            required
            label='Title'
            value={title}
            slotProps={{
              inputLabel: { shrink: true },
              input: { notched: true },
              htmlInput: { maxLength: 300 },
            }}
            onChange={(event) => setTitle(event.target.value)}
          />
          <TextField
            label='Notes'
            multiline
            minRows={3}
            value={notes}
            slotProps={{ htmlInput: { maxLength: 10000 } }}
            onChange={(event) => setNotes(event.target.value)}
          />
          <TextField
            select
            label='Collection'
            value={collectionId}
            disabled={
              collections.isPending ||
              (!isEditing && Boolean(initialCollectionId))
            }
            onChange={(event) => setCollectionId(event.target.value)}
          >
            <MenuItem value=''>Uncategorised</MenuItem>
            {collections.data?.data.map((collection) => (
              <MenuItem key={collection.id} value={collection.id}>
                {collection.name}
              </MenuItem>
            ))}
          </TextField>
          {collections.isError && (
            <Alert severity='warning'>
              Collections could not be loaded. You can still create an
              uncategorised bookmark.
            </Alert>
          )}
          {activeMutation.isError && <Alert severity='error'>{message}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={activeMutation.isPending} onClick={handleClose}>
          Cancel
        </Button>
        <Button
          loading={activeMutation.isPending}
          disabled={!isValid || !isDirty}
          variant='contained'
          onClick={submit}
        >
          {isEditing ? 'Save changes' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
