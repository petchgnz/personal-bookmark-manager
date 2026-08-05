import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { AppShell } from './components/AppShell';
import { LoadingState } from './components/LoadingState';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CallbackPage } from './pages/CallbackPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

const CollectionsPage = lazy(() =>
  import('./pages/CollectionsPage').then((module) => ({
    default: module.CollectionsPage,
  })),
);
const CollectionDetailPage = lazy(() =>
  import('./pages/CollectionDetailPage').then((module) => ({
    default: module.CollectionDetailPage,
  })),
);
const BookmarksPage = lazy(() =>
  import('./pages/BookmarksPage').then((module) => ({
    default: module.BookmarksPage,
  })),
);
const BookmarkDetailPage = lazy(() =>
  import('./pages/BookmarkDetailPage').then((module) => ({
    default: module.BookmarkDetailPage,
  })),
);
const AllBookmarksPage = lazy(() =>
  import('./pages/AllBookmarksPage').then((module) => ({
    default: module.AllBookmarksPage,
  })),
);

export function App() {
  return (
    <Routes>
      <Route path='/login' element={<LoginPage />} />
      <Route path='/callback' element={<CallbackPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to='/collections' replace />} />
          <Route
            path='/collections'
            element={
              <Suspense
                fallback={<LoadingState message='Loading collections…' />}
              >
                <CollectionsPage />
              </Suspense>
            }
          />
          <Route
            path='/collections/:id'
            element={
              <Suspense
                fallback={<LoadingState message='Loading collection…' />}
              >
                <CollectionDetailPage />
              </Suspense>
            }
          />
          <Route
            path='/bookmarks'
            element={
              <Suspense
                fallback={<LoadingState message='Loading bookmarks…' />}
              >
                <BookmarksPage />
              </Suspense>
            }
          />
          <Route
            path='/all'
            element={
              <Suspense
                fallback={<LoadingState message='Loading all bookmarks…' />}
              >
                <AllBookmarksPage />
              </Suspense>
            }
          />
          <Route
            path='/bookmarks/:id'
            element={
              <Suspense fallback={<LoadingState message='Loading bookmark…' />}>
                <BookmarkDetailPage />
              </Suspense>
            }
          />
        </Route>
      </Route>
      <Route path='*' element={<NotFoundPage />} />
    </Routes>
  );
}
