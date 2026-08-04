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

## Authentication Boundary

- Every controller is protected by a global guard; a route may become public only through an explicit future exemption.
- The `Authorization` header must contain exactly `Bearer <access-token>` (scheme matching is case-insensitive).
- The token must have a trusted RS256 signature and satisfy the configured issuer, API audience, expiry/not-before, and non-empty subject requirements.
- ID tokens are rejected because their frontend client audience does not equal the API audience.
- Authentication failures return a generic `401` and do not expose JOSE parsing or signature details.
- The verified `(issuer, subject)` is resolved to a persisted internal user before controller execution. Raw tokens and external identifiers are not returned.

## `GET /me`

Returns the current persisted user directly:

```json
{
  "id": "0d17453d-cb82-42b7-95fb-a17fe12b47fd",
  "email": null,
  "displayName": null,
  "createdAt": "2026-08-04T00:00:00.000Z",
  "updatedAt": "2026-08-04T00:00:00.000Z"
}
```

The endpoint atomically creates the mapping on first use and reuses it thereafter. It does not expose `externalIssuer` or `externalSubject`.

## Collections API

Collection responses contain `id`, `name`, `ownerId`, `createdAt`, and `updatedAt`. Names are trimmed, must be non-empty strings, and have a maximum length of 120 characters. Duplicate names are permitted. Unknown fields and writes to system-managed fields are rejected.

| Method | Path | Behavior |
|---|---|---|
| `POST` | `/collections` | Create an owned collection; returns `201` with the resource. |
| `GET` | `/collections` | Return an owner-scoped paginated list. |
| `GET` | `/collections/:id` | Return one owned collection. |
| `PUT` | `/collections/:id` | Fully replace editable fields; `name` is required. |
| `PATCH` | `/collections/:id` | Update an explicitly provided `name`; omitted/empty input and `null` are invalid. |
| `DELETE` | `/collections/:id` | Delete an owned collection; returns `204`. Related bookmarks survive and become uncategorised. |

List query parameters:

- `page`: positive integer, default `1`.
- `limit`: integer from `1` through `100`, default `20`.
- Unknown, zero, negative, non-integer, or excessive query values return `400` rather than being silently adjusted.
- Results are ordered by `createdAt DESC, id DESC`. Both rows and totals are scoped to the authenticated internal `ownerId`.

All read and mutation predicates contain `ownerId`. Missing and cross-owner identifiers return the identical safe response:

```json
{
  "statusCode": 404,
  "code": "RESOURCE_NOT_FOUND",
  "message": "Collection not found"
}
```

## Error Contract

All application errors use `{ statusCode, code, message, details? }`. Validation failures use `VALIDATION_ERROR`; missing credentials use `UNAUTHENTICATED`; rejected credentials use `INVALID_TOKEN`; hidden missing/cross-owner resources use `RESOURCE_NOT_FOUND`; unexpected failures use `INTERNAL_ERROR`. Validation `details` contains only field-level safe messages. Stack traces, Prisma/SQL details, paths, and token content are not returned.

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

Request validation enforces the Collection limit. Bookmark request limits will be enforced when its API DTOs are implemented.
