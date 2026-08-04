import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/ProtectedRoute'
import { CallbackPage } from './pages/CallbackPage'
import { FoundationPage } from './pages/FoundationPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/collections" replace />} />
          <Route path="/collections" element={<FoundationPage title="Collections" description="Your private bookmark collections will appear here." />} />
          <Route path="/bookmarks" element={<FoundationPage title="Bookmarks" description="Your private bookmarks will appear here." />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
