# Scoreboard P1 V2 Batch 2A — RPC draft validation

## Actual local test results
- Node isolated mock suite: **8/8 passed** (Node v22.16.0).
- PostgreSQL executable/service: **not available in current environment**; no SQL execution or DB-level concurrency test was performed.
- A broad `node --test` run from the environment root was also attempted; it picked up unrelated system tests and failed 7 unrelated tests due missing Playwright modules/CodeMirror fixtures. The scoped scoreboard mock suite was separately run and passed.

## Draft migration
`supabase/migrations/20261123090000_scoreboard_v2_rpc.sql` is still **NOT production-ready** and was not applied.
The draft adds account-scoped mutation dependencies and batch/reset receipt checks under an account head lock, plus dependency/idempotency validation before writes. It still only records mutation ledger data; it does not apply mutations to the app's canonical learning progress/scoreboard data. Reset only advances the server epoch/revision and does not clear the canonical scoreboard. SQL parsing, PostgreSQL transaction behavior, security review, race tests, and integration with the actual app data model remain unverified.

## Safety
No formal Supabase access, production data operations, deployment, or main merge. Changes are committed only to the feature branch.
