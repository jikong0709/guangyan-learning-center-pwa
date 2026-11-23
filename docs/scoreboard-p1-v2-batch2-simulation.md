# Scoreboard P1 V2 Batch 2 RPC simulation & draft migration

## Isolated mock
Run on Node 18+:
```sh
node --test tests/scoreboard-rpc-batch2/scoreboard-rpc.test.cjs
```
Coverage includes batch acceptance/revision, replay receipt, mutation-ID payload conflict, stale revision with zero ACK, account isolation, UNKNOWN reconciliation, reset replay, and epoch fence.


## Migration draft
`supabase/migrations/20261123090000_scoreboard_v2_rpc.sql` creates account heads, mutation ledger, batch/reset receipts and RPCs: head, batch, reconcile, reset. This is a draft and has NOT been executed against PostgreSQL. It records mutation JSON/idempotency metadata but does not yet apply scoreboard payloads to the existing learning_progress/scoreboard data model. SQL syntax, race behavior, auth/RLS/security-definer review, dependency validation, reset fencing, and real DB tests remain required before integration.


## Scope & safety
No formal Supabase, production data, deployment, or main-branch merge was touched. Passing mock tests do not certify PostgreSQL RPC correctness.
