import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { ApiError } from '../api/apiClient'
import { useCreateCollection } from '../api/resourceQueries'

export function CollectionFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const createCollection = useCreateCollection()
  const trimmedName = name.trim()

  const resetAndClose = () => {
    setName('')
    createCollection.reset()
    onClose()
  }

  const handleClose = () => {
    if (!createCollection.isPending) resetAndClose()
  }

  const handleSubmit = () => {
    if (!trimmedName) return
    createCollection.mutate(trimmedName, { onSuccess: resetAndClose })
  }

  const message = createCollection.error instanceof ApiError ? createCollection.error.message : 'Collection could not be created.'
  return <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
    <DialogTitle>Create collection</DialogTitle>
    <DialogContent className="space-y-4">
      <TextField autoFocus fullWidth margin="dense" label="Name" value={name} slotProps={{ htmlInput: { maxLength: 120 } }} onChange={(event) => setName(event.target.value)} error={name.length > 0 && !trimmedName} helperText={`${name.length}/120`} />
      {createCollection.isError && <Alert severity="error">{message}</Alert>}
    </DialogContent>
    <DialogActions><Button disabled={createCollection.isPending} onClick={handleClose}>Cancel</Button><Button loading={createCollection.isPending} disabled={!trimmedName} variant="contained" onClick={handleSubmit}>Create</Button></DialogActions>
  </Dialog>
}
