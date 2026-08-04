import { describe, expect, it } from 'vitest'
import { safeReturnPath } from './safeReturnPath'

describe('safeReturnPath', () => {
  it('preserves an internal route', () => {
    expect(safeReturnPath('/bookmarks?page=2')).toBe('/bookmarks?page=2')
  })

  it.each([
    'https://attacker.example',
    '//attacker.example',
    '/\\attacker.example',
    undefined,
  ])('falls back for unsafe return target %s', (returnTo) => {
    expect(safeReturnPath(returnTo)).toBe('/collections')
  })
})
