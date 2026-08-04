import { useState } from 'react'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link, useSearchParams } from 'react-router'
import { ApiError } from '../api/apiClient'
import { useCollections, useDeleteCollection } from '../api/resourceQueries'
import type { Collection } from '../api/resourceTypes'
import { CollectionFormDialog } from '../components/CollectionFormDialog'
import { DeleteConfirmationDialog } from '../components/DeleteConfirmationDialog'
import { PaginationControls } from '../components/PaginationControls'
import { EmptyState, ResourceError, ResourceLoading } from '../components/ResourceStates'

const pageSize = 20

export function CollectionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const collections = useCollections(page, pageSize)
  const deleteCollection = useDeleteCollection()
  const [createOpen, setCreateOpen] = useState(false)
  const [target, setTarget] = useState<Collection | null>(null)
  const deleteMessage = deleteCollection.error instanceof ApiError ? deleteCollection.error.message : 'Collection could not be deleted.'

  const confirmDelete = () => target && deleteCollection.mutate(target.id, { onSuccess: () => setTarget(null) })
  return <Stack spacing={3}>
    <Stack direction="row" className="items-center justify-between gap-4"><div><Typography variant="h4">Collections</Typography><Typography color="text.secondary">Organise your private bookmarks.</Typography></div><Button variant="contained" onClick={() => setCreateOpen(true)}>New collection</Button></Stack>
    {collections.isPending && <ResourceLoading label="Loading collections" />}
    {collections.isError && <ResourceError onRetry={() => void collections.refetch()} />}
    {collections.data?.data.length === 0 && <EmptyState title="No collections yet" message="Create your first collection to organise bookmarks." />}
    {collections.data && <Stack spacing={2}>{collections.data.data.map((collection) => <Card key={collection.id} variant="outlined"><CardContent><Typography variant="h6">{collection.name}</Typography></CardContent><CardActions><Button component={Link} to={`/collections/${collection.id}`}>View</Button><Button color="error" onClick={() => { deleteCollection.reset(); setTarget(collection) }}>Delete</Button></CardActions></Card>)}<PaginationControls meta={collections.data.meta} onChange={(nextPage) => setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })} /></Stack>}
    <CollectionFormDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    <DeleteConfirmationDialog open={Boolean(target)} title="Delete collection?" message={`Bookmarks in “${target?.name ?? ''}” will remain available as uncategorised bookmarks.`} isPending={deleteCollection.isPending} errorMessage={deleteCollection.isError ? deleteMessage : undefined} onCancel={() => setTarget(null)} onConfirm={confirmDelete} />
  </Stack>
}
