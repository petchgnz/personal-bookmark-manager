# Frontend

React 19 + Vite 8 SPA using React Router 8, MUI 9, Tailwind CSS 4, Auth0 React SDK, and TanStack Query.

## Configure

```powershell
Copy-Item .env.example .env
```

Replace `VITE_AUTH0_CLIENT_ID` with the company-provided SPA Client ID. The domain, API audience, and local API URL are public defaults from the assignment. Never add a Client Secret, password, Access Token, or ID Token.

Required Auth0 application URLs:

- Callback: `http://localhost:5173/callback`
- Logout: `http://localhost:5173`
- Web origin: `http://localhost:5173`

## Run and verify

```powershell
npm run dev --workspace=frontend
npm test --workspace=frontend
npm run typecheck --workspace=frontend
npm run lint --workspace=frontend
npm run build --workspace=frontend
```

The Access Token cache is memory-only. Protected requests obtain a token silently for `https://bbl-candidate-test-api` and attach it through the centralized API client.
