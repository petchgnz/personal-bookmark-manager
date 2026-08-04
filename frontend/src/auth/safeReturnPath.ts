export function safeReturnPath(returnTo: unknown): string {
  if (
    typeof returnTo !== 'string' ||
    !returnTo.startsWith('/') ||
    returnTo.startsWith('//') ||
    returnTo.startsWith('/\\')
  ) {
    return '/collections'
  }
  return returnTo
}
