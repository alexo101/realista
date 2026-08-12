---
name: Client update array columns
description: PostgreSQL array columns in client updates need explicit SQL handling when the ORM-generated assignment is incompatible.
---

When updating client records, keep custom array columns such as CRM tags out of a broad ORM object spread if the driver can encode them as a PostgreSQL record. Write them with an explicit, parameterized `text[]` SQL expression instead.

**Why:** A JavaScript string array was being sent to a PostgreSQL `text[]` column as a `record`, causing every agent-side client save to return HTTP 400.

**How to apply:** Preserve empty arrays as `ARRAY[]::text[]`, use `NULL::text[]` only for null values, and keep scalar client fields in the normal update path.