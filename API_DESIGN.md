# API Design

This document will track the implemented API contract for the Personal Bookmark Manager.

## Initial Contract

Every route is authenticated. Single-resource responses return the resource directly. Paginated list responses use:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

Required routes:

```text
GET    /me

GET    /collections
GET    /collections/:id
POST   /collections
PUT    /collections/:id
PATCH  /collections/:id
DELETE /collections/:id

GET    /bookmarks
GET    /bookmarks/:id
POST   /bookmarks
PUT    /bookmarks/:id
PATCH  /bookmarks/:id
DELETE /bookmarks/:id

GET    /collections/:id/bookmarks
```

Implementation details, validation limits, query parameters, error codes, and privacy behavior must be added as the backend is implemented.

## Persisted Identity and Ownership

- `User.id` is the internal UUID used as `ownerId` for collections and bookmarks.
- A unique `(externalIssuer, externalSubject)` pair maps a verified OIDC identity to one internal user.
- Email and display name are nullable profile data and are not identity keys.
- User deletion is outside the current API scope; required ownership foreign keys use `RESTRICT` to prevent accidental data loss.

## Collection and Bookmark Relation

- A bookmark may be uncategorised.
- Deleting a collection sets its bookmarks' collection relation to `NULL` without changing bookmark ownership.
- The database stores an internal `collectionOwnerId` alongside `collectionId`.
- A composite foreign key targets `Collection(id, ownerId)`.
- A database CHECK constraint requires the internal collection owner to equal `Bookmark.ownerId` when categorised and requires both collection relation fields to be null when uncategorised.
- API responses must not expose the internal `collectionOwnerId` field.
- Application services must still scope queries by the authenticated owner and return `404` for missing or cross-owner relations; the database constraint is defense in depth, not a replacement for authorization.

## Initial Field Limits

| Field | Database limit |
|---|---:|
| Collection name | 120 characters |
| Bookmark URL | 2048 characters |
| Bookmark title | 300 characters |
| Bookmark notes | PostgreSQL `TEXT` |
| External issuer | 512 characters |
| External subject | 255 characters |
| Email | 320 characters |
| Display name | 200 characters |

Request validation will enforce these limits before persistence when the API DTOs are implemented.
