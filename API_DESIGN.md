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
GET    /all

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

- `page`: integer from `1` through `1,000,000`, default `1`.
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

Unexpected exceptions are normalized to exactly `500 INTERNAL_ERROR` with `Internal server error`; their original message is not copied into the response. The application does not log raw Bearer tokens, request authorization headers, Prisma queries, or exception objects that could contain secrets.

## Browser API Boundary

The backend CORS policy allows `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, and `OPTIONS` with `Authorization`/`Content-Type` only from the configured `FRONTEND_ORIGIN` (local default `http://localhost:3000`). The local API listens on port 3001 because Auth0's fixed callback assigns port 3000 to the SPA. Untrusted origins receive no `Access-Control-Allow-Origin` header. CORS is a browser boundary in addition to—not a replacement for—Bearer authentication and owner-scoped authorization.

## Bookmarks API

Bookmark responses contain `id`, `url`, `title`, `notes`, `collectionId`, `ownerId`, `createdAt`, and `updatedAt`. The internal `collectionOwnerId` defense-in-depth field is never exposed.

| Method | Path | Behavior |
|---|---|---|
| `POST` | `/bookmarks` | Create an owned bookmark; `notes` and `collectionId` default to `null`. |
| `GET` | `/bookmarks` | Return an owner-scoped paginated/filterable list. |
| `GET` | `/bookmarks/:id` | Return one owned bookmark. |
| `PUT` | `/bookmarks/:id` | Fully replace editable fields; all four fields are required, using explicit `null` for cleared nullable fields. |
| `PATCH` | `/bookmarks/:id` | Update explicitly provided fields; `notes` and `collectionId` accept `null`; `url` and `title` do not. |
| `DELETE` | `/bookmarks/:id` | Delete an owned bookmark and return `204`. |
| `GET` | `/collections/:id/bookmarks` | Authorize the collection, then return only its owner-scoped bookmarks. |

Validation:

- `url`: trimmed, non-empty, absolute `http` or `https`, maximum 2,048 characters. Unsafe/non-web schemes are rejected.
- `title`: trimmed, non-empty, maximum 300 characters.
- `notes`: nullable trimmed string, maximum 10,000 characters.
- `collectionId`: nullable UUID. Any non-null relation must identify a collection owned by the authenticated user; another user's and missing collection both return the same Collection `404`.
- Unknown or system-managed fields are rejected. Duplicate URLs are permitted.

List filters extend the same `page`/`limit` contract used by Collections:

- `collectionId=<uuid>` returns bookmarks in that collection without exposing whether a foreign collection exists.
- `uncategorised=true` explicitly returns bookmarks whose `collectionId` is `null`.
- The two filters are mutually exclusive. `uncategorised=false`, unknown filters, and invalid values return `400`.
- Optional `search` is trimmed, must contain 1–200 characters, and performs PostgreSQL full-text search over title (weight A) and notes (weight B) using the English text configuration. It may be combined with either `collectionId` or `uncategorised=true`.
- Plain letter/number search terms use PostgreSQL prefix matching, so a partial term such as `net` matches `Netflix`. Multiple plain terms retain AND semantics after English text normalization.
- Advanced input uses `websearch_to_tsquery`: quoted phrases, `OR`, leading `-` exclusion, and punctuation retain PostgreSQL web-search semantics rather than being interpreted as SQL.
- Search results are ordered by cover-density relevance, then `createdAt DESC, id DESC`; rows and totals remain paginated and owner-scoped.
- The weighted GIN expression index is defined by the committed migration because Prisma schema DSL cannot represent this PostgreSQL expression index. Search SQL uses parameter-bound `Prisma.sql`; no unsafe raw query API or interpolated SQL string is used.

For the nested route, a missing or cross-owner collection returns the identical Collection `404`; an owned empty collection returns a paginated `200` with empty `data`. Both bookmark rows and totals include `ownerId` and `collectionId` predicates.

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
| Bookmark notes | PostgreSQL `TEXT`; API maximum 10,000 characters |
| External issuer | 512 characters |
| External subject | 255 characters |
| Email | 320 characters |
| Display name | 200 characters |

Request validation enforces all Collection and Bookmark API limits before persistence.

## `GET /all` Bonus Overview

Returns every owned collection with its owned bookmarks plus a separate `uncategorisedBookmarks` array. Empty collections remain visible. Collections and bookmarks use the same fields and deterministic ordering as their existing list endpoints.

```json
{
  "collections": [
    {
      "id": "collection-uuid",
      "name": "Engineering",
      "ownerId": "user-uuid",
      "createdAt": "2026-08-05T00:00:00.000Z",
      "updatedAt": "2026-08-05T00:00:00.000Z",
      "bookmarks": []
    }
  ],
  "uncategorisedBookmarks": []
}
```

The endpoint runs exactly two owner-scoped reads in one transaction—one for collections and one for bookmarks—and groups them in memory. Query count therefore does not grow with the number of collections. No foreign rows, counts, or relation identifiers enter the response. The endpoint is intentionally unpaginated because it implements the assignment's `/all` overview; it is suitable for the take-home data scale, while a production system with unbounded user data should use a bounded or cursor-paginated grouped contract.
