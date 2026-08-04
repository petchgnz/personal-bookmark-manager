export const oidcOptionsToken = Symbol('OIDC_OPTIONS');
export const oidcKeyResolverToken = Symbol('OIDC_KEY_RESOLVER');

export const defaultOidcOptions = {
  issuer: 'https://dev-yg.us.auth0.com/',
  audience: 'https://bbl-candidate-test-api',
  jwksUri: 'https://dev-yg.us.auth0.com/.well-known/jwks.json',
} as const;
