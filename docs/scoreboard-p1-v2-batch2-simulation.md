# Scoreboard P1 V2 Batch 2 — RPC Simulation

This isolated Node mock models the server RPC contract without connecting to Supabase.

Run: `node --test tests/scoreboard-rpc-batch2/scoreboard-rpc.test.cjs`

Coverage: atomic mutation batches, batch receipt replay, mutation ID/payload idempotency conflict, revision conflict with zero ACK, account scope, mutation reconciliation for uncertain outcomes, reset receipt replay, and reset-epoch fencing.

The mock is a contract simulator, not a database concurrency test. Production SQL must be reviewed and exercised in an isolated Supabase test project before enabling the client transport. No production database or deployment is part of Batch 2.
