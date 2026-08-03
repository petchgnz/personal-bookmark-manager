# security-review

Review authentication, token validation, input validation, mass assignment, error leakage, sensitive logging, data-access scoping, relation authorization, and test evidence.

Use this workflow for any auth, API, validation, logging, or persistence change.

## Checklist

- Confirm every route is authenticated.
- Confirm only Access Tokens for the configured API audience are accepted.
- Confirm token claims are trusted only after signature, algorithm, issuer, audience, and expiry validation.
- Confirm every read and mutation is scoped by authenticated internal `ownerId`.
- Confirm relation changes verify referenced resources belong to the same owner.
- Confirm missing and cross-owner resources return indistinguishable `404` responses.
- Confirm errors and logs do not expose secrets, tokens, stack traces, SQL, Prisma internals, or filesystem paths.
- Confirm tests cover the security behavior changed in the session.
