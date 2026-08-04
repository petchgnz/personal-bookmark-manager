import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router';
import type { Bookmark } from '../api/resourceTypes';

export function BookmarkList({
  bookmarks,
  onDelete,
}: {
  bookmarks: Bookmark[];
  onDelete: (bookmark: Bookmark) => void;
}) {
  return (
    <Stack spacing={2}>
      {bookmarks.map((bookmark) => (
        <Card key={bookmark.id} variant='outlined'>
          <CardContent>
            <Stack
              direction='row'
              className='items-start justify-between gap-3'
            >
              <div className='min-w-0'>
                <Typography variant='h6' className='truncate'>
                  {bookmark.title}
                </Typography>
                <Typography
                  component='a'
                  href={bookmark.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  color='primary'
                  className='break-all'
                >
                  {bookmark.url}
                </Typography>
              </div>
              {!bookmark.collectionId && (
                <Chip size='small' label='Uncategorised' />
              )}
            </Stack>
            {bookmark.notes && (
              <Typography
                color='text.secondary'
                className='mt-3 whitespace-pre-wrap'
              >
                {bookmark.notes}
              </Typography>
            )}
          </CardContent>
          <CardActions>
            <Button component={Link} to={`/bookmarks/${bookmark.id}`}>
              View
            </Button>
            <Button color='error' onClick={() => onDelete(bookmark)}>
              Delete
            </Button>
          </CardActions>
        </Card>
      ))}
    </Stack>
  );
}
