import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { ApiError } from '../api/apiClient'
import { useCollections, useCreateBookmark } from '../api/resourceQueries'

const collectionLimit = 100

export function BookmarkFormDialog({ open, initialCollectionId, onClose }: { open: boolean; initialCollectionId?: string; onClose: () => void }) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [collectionId, setCollectionId] = useState(initialCollectionId ?? '')
  const collections = useCollections(1, collectionLimit)
  const createBookmark = useCreateBookmark()

  const resetAndClose = () => {
    setUrl(''); setTitle(''); setNotes(''); setCollectionId(initialCollectionId ?? '')
    createBookmark.reset(); onClose()
  }

  const handleClose = () => {
    if (!createBookmark.isPending) resetAndClose()
  }

  const submit = () => createBookmark.mutate({
    url: url.trim(), title: title.trim(), notes: notes.trim() || null, collectionId: collectionId || null,
  }, { onSuccess: resetAndClose })

  const isValid = url.trim().length > 0 && title.trim().length > 0
  const message = createBookmark.error instanceof ApiError ? createBookmark.error.message : 'Bookmark could not be created.'
  return <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
    <DialogTitle>Create bookmark</DialogTitle>
    <DialogContent><Stack spacing={2} className="pt-2">
      <TextField autoFocus required label="URL" type="url" value={url} slotProps={{ inputLabel: { shrink: true }, input: { notched: true }, htmlInput: { maxLength: 2048 } }} onChange={(event) => setUrl(event.target.value)} />
      <TextField required label="Title" value={title} slotProps={{ inputLabel: { shrink: true }, input: { notched: true }, htmlInput: { maxLength: 300 } }} onChange={(event) => setTitle(event.target.value)} />
      <TextField label="Notes" multiline minRows={3} value={notes} slotProps={{ htmlInput: { maxLength: 10000 } }} onChange={(event) => setNotes(event.target.value)} />
      <TextField select label="Collection" value={collectionId} disabled={collections.isPending || Boolean(initialCollectionId)} onChange={(event) => setCollectionId(event.target.value)}>
        <MenuItem value="">Uncategorised</MenuItem>{collections.data?.data.map((collection) => <MenuItem key={collection.id} value={collection.id}>{collection.name}</MenuItem>)}
      </TextField>
      {collections.isError && <Alert severity="warning">Collections could not be loaded. You can still create an uncategorised bookmark.</Alert>}
      {createBookmark.isError && <Alert severity="error">{message}</Alert>}
    </Stack></DialogContent>
    <DialogActions><Button disabled={createBookmark.isPending} onClick={handleClose}>Cancel</Button><Button loading={createBookmark.isPending} disabled={!isValid} variant="contained" onClick={submit}>Create</Button></DialogActions>
  </Dialog>
}
