import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { Link } from 'react-router';
import type { Bookmark } from '../api/resourceTypes';

export function OverviewBookmarkList({ bookmarks }: { bookmarks: Bookmark[] }) {
  return (
    <List disablePadding>
      {bookmarks.map((bookmark) => (
        <ListItem key={bookmark.id} disablePadding>
          <ListItemButton component={Link} to={`/bookmarks/${bookmark.id}`}>
            <ListItemText
              primary={bookmark.title}
              secondary={bookmark.url}
              slotProps={{ secondary: { className: 'break-all' } }}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}
