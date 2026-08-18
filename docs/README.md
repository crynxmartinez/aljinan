# docs/

Historical documents, moved here from the repository root where 34 markdown files had
accumulated.

## Read these with care

Several of these files describe work as finished that was not, or describe protections the
code did not implement. Two examples that cost real time to discover:

- The security documents describe audit logging as in place. `lib/audit-log.ts` wrote to
  `console.log` with the database call commented out, and there was no `AuditLog` table
  until August 2026.
- Rate limiting is described as configured. Every limiter fell through to an in-process
  store whose window never expired, and only two routes called it at all.

Treat anything here as a record of intent at the time it was written, not as a description
of the current system. **The code is the specification.** Where a document and the code
disagree, the code is right and the document is out of date.

## What is current

| Where | What it covers |
|---|---|
| `../README.md` | What the platform is, and how to run it |
| `../ARCHITECTURE.md` | System design and the data model |
| `../SETUP.md` | Getting a development environment running |
| `../DEPLOYMENT.md` | Deploying |
| `../CONTRIBUTING.md` | How to work on this |
| `../FEATURES.md` | Feature inventory |
| `../.env.example` | Every environment variable, with why each matters |

## Verification scripts

These assert current behaviour, so unlike the documents they cannot drift:

- `scripts/verify-security.mjs` — access control, tenancy isolation, abuse limits
- `scripts/verify-certificates.mjs` — a certificate is only issued for equipment that passed
- `scripts/audit-auto-certificates.ts` — read-only report over certificates already issued

Each needs a local database and a running dev server. See `scripts/dev-db.mjs`.
