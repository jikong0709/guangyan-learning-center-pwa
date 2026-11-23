# Scoreboard P1 V2 — Server RPC Contract (Draft)

**Safety boundary:** this document is a client/server contract proposal only. No production Supabase query, migration, RPC, deployment, or merge was performed.

## Required server-authoritative primitives

The existing client-only mutation journal cannot safely prevent cross-device overwrite or data resurrection. Production integration must use server-authoritative revision and reset epoch.

### `scoreboard_mutation_batch`

Input: `user_id` (must match auth.uid()), `batch_id`, `base_revision`, `reset_epoch`, ordered mutation array.

Each mutation requires `mutation_id`, `sequence`, `entity_type`, `entity_id`, `operation`, `payload`, `payload_hash`, `dependency_ids`.

Transaction requirements:
- Validate caller identity against auth.uid(); reject any foreign user scope.
- Lock the user's scoreboard head row (revision and reset_epoch).
- Reject stale reset epoch; never accept old-epoch mutations.
- Idempotency key is unique per account: (user_id, mutation_id). Same key + same payload hash returns prior result; same key + different hash is a hard conflict.
- Validate dependency IDs/order before applying dependent mutations.
- Apply accepted mutations and increment revision atomically.
- Return exact accepted mutation IDs, per-mutation rejection reasons, current revision and epoch. Never ACK a batch wholesale.

### `scoreboard_reset`

Input: `user_id` (must match auth.uid()), stable `reset_request_id`, expected epoch.

Requirements:
- Unique reset request per account; retrying the same request ID returns the original result.
- Lock scoreboard head and atomically increment reset_epoch, clear/reset authoritative scoreboard state, and record reset receipt.
- A request from an older epoch must not reset a newer epoch.
- Return reset receipt, resulting epoch, revision, reset request ID.
- Reset success is not inferred from client timeout; client must query receipt/status by reset request ID.

### `scoreboard_get_head`

Returns current account's revision, reset_epoch, and snapshot metadata. Account access must be constrained to auth.uid().

## Client acceptance gates

1. Mutations created during an in-flight batch remain queued for the next batch.
2. ACK only server-returned accepted IDs.
3. Unknown timeout outcomes are reconciled by mutation ID before retrying.
4. Account switch cancels active transport, quarantines unresolved work in its original account namespace, and loads the new account's state.
5. Reset timeout is reconciled using the stable reset request ID; never mint a new ID merely because the response was lost.
6. Old snapshots and mutations are rejected by epoch, preventing reset data resurrection.
7. No whole-state blind upsert fallback is permitted once mutation sync is active.
8. Conflict, auth, revision-read, or malformed-response failures preserve local source data and mark recovery required.

## Non-goals for client-only batch

The current client module cannot guarantee server idempotency, cross-device ordering, account authorization, atomic reset, or stale-device fencing by itself. Those require the server RPCs and database constraints above.
