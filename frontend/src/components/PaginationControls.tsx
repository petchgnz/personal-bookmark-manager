import Pagination from '@mui/material/Pagination'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { PaginationMeta } from '../api/resourceTypes'

export function PaginationControls({ meta, onChange }: { meta: PaginationMeta; onChange: (page: number) => void }) {
  if (meta.totalPages <= 1) return null
  return <Stack className="items-center pt-2" spacing={1}><Pagination page={meta.page} count={meta.totalPages} onChange={(_, page) => onChange(page)} /><Typography variant="caption" color="text.secondary">{meta.total} items</Typography></Stack>
}
