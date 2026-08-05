import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useBookmarkOverview } from '../api/resourceQueries';
import { OverviewBookmarkList } from '../components/OverviewBookmarkList';
import {
  EmptyState,
  ResourceError,
  ResourceLoading,
} from '../components/ResourceStates';

export function AllBookmarksPage() {
  const overview = useBookmarkOverview();
  const isEmpty =
    overview.data?.collections.length === 0 &&
    overview.data.uncategorisedBookmarks.length === 0;

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant='h4'>All bookmarks</Typography>
        <Typography color='text.secondary'>
          Browse every private bookmark grouped by collection.
        </Typography>
      </div>

      {overview.isPending && <ResourceLoading label='Loading all bookmarks' />}
      {overview.isError && (
        <ResourceError onRetry={() => void overview.refetch()} />
      )}
      {isEmpty && (
        <EmptyState
          title='No bookmarks or collections yet'
          message='Create a collection or bookmark to see it here.'
        />
      )}
      {overview.data && !isEmpty && (
        <Stack spacing={3}>
          {overview.data.collections.map((collection) => (
            <Card key={collection.id} variant='outlined'>
              <CardContent>
                <Typography variant='h6'>{collection.name}</Typography>
                <Typography color='text.secondary'>
                  {collection.bookmarks.length}{' '}
                  {collection.bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}
                </Typography>
              </CardContent>
              {collection.bookmarks.length > 0 && (
                <>
                  <Divider />
                  <OverviewBookmarkList bookmarks={collection.bookmarks} />
                </>
              )}
            </Card>
          ))}

          {overview.data.uncategorisedBookmarks.length > 0 && (
            <Card variant='outlined'>
              <CardContent>
                <Typography variant='h6'>Uncategorised</Typography>
                <Typography color='text.secondary'>
                  Bookmarks that do not belong to a collection.
                </Typography>
              </CardContent>
              <Divider />
              <OverviewBookmarkList
                bookmarks={overview.data.uncategorisedBookmarks}
              />
            </Card>
          )}
        </Stack>
      )}
    </Stack>
  );
}
