import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { ApiError } from '../api/apiClient';
import {
  useCreateCollection,
  useUpdateCollection,
} from '../api/resourceQueries';
import type { Collection } from '../api/resourceTypes';

export function CollectionFormDialog({
  open,
  collection,
  onClose,
}: {
  open: boolean;
  collection?: Pick<Collection, 'id' | 'name'>;
  onClose: () => void;
}) {
  const [name, setName] = useState(collection?.name ?? '');
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const isEditing = collection !== undefined;
  const activeMutation = isEditing ? updateCollection : createCollection;
  const trimmedName = name.trim();

  useEffect(() => {
    if (open) setName(collection?.name ?? '');
  }, [collection?.name, open]);

  const resetAndClose = () => {
    setName(collection?.name ?? '');
    createCollection.reset();
    updateCollection.reset();
    onClose();
  };

  const handleClose = () => {
    if (!activeMutation.isPending) resetAndClose();
  };

  const handleSubmit = () => {
    if (!trimmedName) return;
    if (collection) {
      updateCollection.mutate(
        { id: collection.id, name: trimmedName },
        { onSuccess: resetAndClose },
      );
    } else {
      createCollection.mutate(trimmedName, { onSuccess: resetAndClose });
    }
  };

  const message =
    activeMutation.error instanceof ApiError ?
      activeMutation.error.message
    : `Collection could not be ${isEditing ? 'updated' : 'created'}.`;
  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth='sm'>
      <DialogTitle>
        {isEditing ? 'Edit collection' : 'Create collection'}
      </DialogTitle>
      <DialogContent className='space-y-4'>
        <TextField
          autoFocus
          fullWidth
          margin='dense'
          label='Name'
          value={name}
          slotProps={{
            inputLabel: { shrink: true },
            input: { notched: true },
            htmlInput: { maxLength: 120 },
          }}
          onChange={(event) => setName(event.target.value)}
          error={name.length > 0 && !trimmedName}
          helperText={`${name.length}/120`}
        />
        {activeMutation.isError && <Alert severity='error'>{message}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button disabled={activeMutation.isPending} onClick={handleClose}>
          Cancel
        </Button>
        <Button
          loading={activeMutation.isPending}
          disabled={
            !trimmedName || (isEditing && trimmedName === collection.name)
          }
          variant='contained'
          onClick={handleSubmit}
        >
          {isEditing ? 'Save changes' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
