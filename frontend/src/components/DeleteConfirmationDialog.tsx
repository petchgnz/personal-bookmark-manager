import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

interface DeleteConfirmationDialogProps {
  open: boolean
  title: string
  message: string
  isPending: boolean
  errorMessage?: string
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteConfirmationDialog(props: DeleteConfirmationDialogProps) {
  return <Dialog open={props.open} onClose={props.isPending ? undefined : props.onCancel} fullWidth maxWidth="xs">
    <DialogTitle>{props.title}</DialogTitle>
    <DialogContent><DialogContentText>{props.message}</DialogContentText>{props.errorMessage && <Alert severity="error" className="mt-4">{props.errorMessage}</Alert>}</DialogContent>
    <DialogActions><Button disabled={props.isPending} onClick={props.onCancel}>Cancel</Button><Button loading={props.isPending} color="error" variant="contained" onClick={props.onConfirm}>Delete</Button></DialogActions>
  </Dialog>
}
