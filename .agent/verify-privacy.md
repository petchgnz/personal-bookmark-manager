# verify-privacy

Verify that every collection and bookmark remains private to its owner.

Use this workflow for every new or modified endpoint, filter, nested route, relation mutation, pagination behavior, and delete behavior.

## Checklist

- Identify every endpoint and data-access method changed.
- Confirm owner scoping is applied in the database query.
- Confirm pagination totals and filters cannot include another user's data.
- Confirm nested collection bookmark routes scope both the collection and returned bookmarks.
- Confirm User A cannot create or move a bookmark into User B's collection.
- Confirm deleting User A's collection cannot affect User B's bookmarks.
- Run or add two-user negative tests for every changed behavior.
