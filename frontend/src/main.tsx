import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider, type AppState } from '@auth0/auth0-react'
import GlobalStyles from '@mui/material/GlobalStyles'
import CssBaseline from '@mui/material/CssBaseline'
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'
import { App } from './App'
import { safeReturnPath } from './auth/safeReturnPath'
import { ConfigurationError } from './components/ConfigurationError'
import { getRuntimeConfig } from './config/runtimeConfig'
import { queryClient } from './query/queryClient'
import { theme } from './theme/theme'
import './index.css'

const root = createRoot(document.getElementById('root')!)

try {
  const config = getRuntimeConfig()
  const onRedirectCallback = (appState?: AppState) => {
    window.history.replaceState(
      {},
      document.title,
      safeReturnPath(appState?.returnTo),
    )
  }

  root.render(
    <StrictMode>
      <StyledEngineProvider enableCssLayer>
        <GlobalStyles styles="@layer theme, mui, components, utilities;" />
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Auth0Provider
            domain={config.auth0Domain}
            clientId={config.auth0ClientId}
            cacheLocation="memory"
            authorizationParams={{
              audience: config.auth0Audience,
              redirect_uri: `${window.location.origin}/callback`,
            }}
            onRedirectCallback={onRedirectCallback}
          >
            <QueryClientProvider client={queryClient}>
              <BrowserRouter><App /></BrowserRouter>
            </QueryClientProvider>
          </Auth0Provider>
        </ThemeProvider>
      </StyledEngineProvider>
    </StrictMode>,
  )
} catch (error) {
  root.render(<StrictMode><ConfigurationError error={error} /></StrictMode>)
}
