import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../dist/score-board.js', import.meta.url), 'utf8');

test('scoreboard save uses revision RPC and avoids direct cloud upsert', () => {
  assert.match(source, /rpc\('scoreboard_save'/);
  assert.match(source, /p_expected_revision:serverRevision/);
  assert.doesNotMatch(source, /\.upsert\(/);
});

test('revision conflicts refresh state/revision and retry boundedly', () => {
  assert.match(source, /for\(let attempt=0;attempt<3;attempt\+\+\)/);
  assert.match(source, /select\('state,revision'\)/);
  assert.match(source, /scoreboard revision conflict after retries/);
});

test('reset uses server RPC with unique request id and reloads authoritative state', () => {
  assert.match(source, /crypto\.randomUUID\(\)/);
  assert.match(source, /rpc\('scoreboard_reset'/);
  assert.match(source, /select\('state,revision'\)/);
});

test('reset-in-flight blocks click mutations and modal submission', () => {
  assert.match(source, /if\(resetPending\)\{toast\('雲端重置進行中，請稍候。'\);return\}/);
  assert.match(source, /if\(resetPending\)\{toast\('雲端重置進行中，請稍候。'\);return\}if\(!accountReady/);
  assert.match(source, /resetPending=true;accountReady=false;render\(\)/);
  assert.match(source, /finally\(\)=>\{resetPending=false/);
});

test('migration serializes save/reset and rejects stale revision', async () => {
  const migration = await readFile(new URL('../supabase/migrations/20261120090000_scoreboard_revision_atomic_reset.sql', import.meta.url), 'utf8');
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /p_expected_revision is distinct from v_current/);
  assert.match(migration, /primary key \(user_id, request_id\)/);
  assert.match(migration, /scoreboard_reset_requests/);
});

function createServerModel() {
  let revision = 0;
  let state = { records: ['seed'] };
  const resetRequests = new Map();
  return {
    save(expected, next) {
      if (expected !== revision) return { accepted: false, revision };
      state = structuredClone(next);
      revision += 1;
      return { accepted: true, revision };
    },
    reset(requestId) {
      if (resetRequests.has(requestId)) return { accepted: true, revision: resetRequests.get(requestId), duplicate: true };
      state = { records: [] };
      revision += 1;
      resetRequests.set(requestId, revision);
      return { accepted: true, revision, duplicate: false };
    },
    read() { return { revision, state: structuredClone(state) }; }
  };
}

test('first save accepts current revision and increments revision', () => {
  const server = createServerModel();
  const result = server.save(0, { records: ['a'] });
  assert.deepEqual(result, { accepted: true, revision: 1 });
  assert.deepEqual(server.read(), { revision: 1, state: { records: ['a'] } });
});

test('stale save is rejected without mutating state', () => {
  const server = createServerModel();
  server.save(0, { records: ['first'] });
  const stale = server.save(0, { records: ['stale'] });
  assert.equal(stale.accepted, false);
  assert.equal(server.read().state.records[0], 'first');
});

test('two concurrent clients with same revision: only one wins', () => {
  const server = createServerModel();
  const expected = server.read().revision;
  const first = server.save(expected, { records: ['device-A'] });
  const second = server.save(expected, { records: ['device-B'] });
  assert.equal(first.accepted, true);
  assert.equal(second.accepted, false);
  assert.equal(server.read().revision, 1);
});

test('reset clears state and advances revision', () => {
  const server = createServerModel();
  server.save(0, { records: ['old'] });
  const result = server.reset('reset-1');
  assert.equal(result.revision, 2);
  assert.deepEqual(server.read().state, { records: [] });
});

test('duplicate reset request is idempotent', () => {
  const server = createServerModel();
  const first = server.reset('same-id');
  const second = server.reset('same-id');
  assert.deepEqual(second, { accepted: true, revision: first.revision, duplicate: true });
  assert.equal(server.read().revision, first.revision);
});

test('delayed pre-reset save cannot overwrite reset snapshot', () => {
  const server = createServerModel();
  const delayedExpected = server.read().revision;
  server.reset('reset-before-delayed-save');
  const delayed = server.save(delayedExpected, { records: ['late-old'] });
  assert.equal(delayed.accepted, false);
  assert.deepEqual(server.read().state, { records: [] });
});

test('fresh post-reset revision accepts a new save', () => {
  const server = createServerModel();
  server.reset('reset-fresh');
  const fresh = server.read();
  const result = server.save(fresh.revision, { records: ['new-after-reset'] });
  assert.equal(result.accepted, true);
  assert.deepEqual(server.read().state, { records: ['new-after-reset'] });
});
