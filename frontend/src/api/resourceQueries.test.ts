import { describe, expect, it } from 'vitest';
import {
  buildBookmarkQuery,
  buildCollectionQuery,
  buildPageQuery,
} from './resourceQueries';

describe('resource query builders', () => {
  it('builds bounded pagination parameters', () => {
    expect(buildPageQuery(2, 20)).toBe('page=2&limit=20');
  });

  it('encodes an optional collection name filter', () => {
    expect(buildCollectionQuery(2, 20, 'engineering notes')).toBe(
      'page=2&limit=20&name=engineering+notes',
    );
  });

  it('builds a collection filter without an uncategorised filter', () => {
    expect(
      buildBookmarkQuery({ page: 1, limit: 20, collectionId: 'collection-id' }),
    ).toBe('page=1&limit=20&collectionId=collection-id');
  });

  it('builds the explicit uncategorised filter', () => {
    expect(
      buildBookmarkQuery({ page: 3, limit: 20, uncategorised: true }),
    ).toBe('page=3&limit=20&uncategorised=true');
  });

  it('combines and encodes full-text search with an existing filter', () => {
    expect(
      buildBookmarkQuery({
        page: 1,
        limit: 20,
        collectionId: 'collection-id',
        search: 'prisma handbook',
      }),
    ).toBe('page=1&limit=20&collectionId=collection-id&search=prisma+handbook');
  });
});
