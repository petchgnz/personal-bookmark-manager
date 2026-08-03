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
