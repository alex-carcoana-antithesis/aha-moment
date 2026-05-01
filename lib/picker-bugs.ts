// Bug roster for the /picker flow. Each entry mirrors the shape consumed by
// `components/bug-picker.tsx` — id, copy, tokenised code, and the Antithesis
// verdict line (with `inline-code` segments wrapped in backticks).

export type PickerBugId = "race" | "deadlock" | "ordering" | "zombie" | "cache";

export type CodeLine = string[];

export type PickerBug = {
  id: PickerBugId;
  name: string;
  emoji: string;
  descriptions: Record<string, string>;
  tag: string;
  invariant: string;
  codeFile: string;
  code: CodeLine[];
  verdict: string;
  faults: string[];
};

export const PICKER_BUGS: PickerBug[] = [
  {
    id: "race",
    name: "Race Condition",
    emoji: "🐛",
    descriptions: {
      "Web apps":
        "Two cron jobs — one clears a cache and recalculates, the other reads it. They align in the same 10ms window. Reader gets null.",
      "Fintech":
        "Two payment processors read the same account balance simultaneously. One transfer goes through that shouldn’t.",
      "Blockchain":
        "Two nodes validate the same transaction in the same block window. One gets committed. The other never knows.",
      "Databases":
        "Two queries write to the same row. The lock window is 8ms. One write silently disappears.",
      "Cloud infrastructure":
        "Two autoscaler jobs read the same instance count. Both spin up new nodes. You’re now running double the capacity.",
    },
    tag: "Concurrency",
    invariant: "This value should never be null when read",
    codeFile: "revenue-cache.js",
    code: [
      ["kw", "let ", "var", "cachedRevenue", "punct", " = ", "kw", "null", "punct", ";"], ["br"],
      [],
      ["kw", "async function ", "fn", "refreshRevenueCache", "punct", "() {"], ["br"],
      ["  ", "var", "cachedRevenue", "punct", " = ", "kw", "null", "punct", ";                          ", "com", "// briefly null while recalculating"], ["br"],
      ["  ", "kw", "const ", "var", "payments", "punct", " = ", "kw", "await ", "fn", "fetchTodaysPayments", "punct", "();  ", "com", "// takes ~10ms"], ["br"],
      ["  ", "var", "cachedRevenue", "punct", " = ", "var", "payments", "punct", ".", "fn", "reduce", "punct", "((", "var", "sum", "punct", ", ", "var", "p", "punct", ") => ", "var", "sum", "punct", " + ", "var", "p", "punct", ".", "prop", "amount", "punct", ", ", "num", "0", "punct", ");"], ["br"],
      ["punct", "}"], ["br"],
      [],
      ["kw", "async function ", "fn", "sendRevenueAlert", "punct", "() {"], ["br"],
      ["  ", "kw", "if ", "punct", "(", "var", "cachedRevenue", "punct", " === ", "kw", "null", "punct", ") {"], ["br"],
      ["    ", "var", "logger", "punct", ".", "fn", "warn", "punct", "(", "str", "\"Revenue cache empty, skipping alert\"", "punct", ");"], ["br"],
      ["    ", "kw", "return", "punct", ";"], ["br"],
      ["  ", "punct", "}"], ["br"],
      ["  ", "kw", "if ", "punct", "(", "var", "cachedRevenue", "punct", " > ", "var", "THRESHOLD", "punct", ") {"], ["br"],
      ["    ", "kw", "await ", "var", "pagerduty", "punct", ".", "fn", "trigger", "punct", "(", "str", "\"Revenue spike detected\"", "punct", ");"], ["br"],
      ["  ", "punct", "}"], ["br"],
      ["punct", "}"], ["br"],
    ],
    verdict: "Antithesis paused `refreshRevenueCache` for 10ms right after clearing the value — exposing the exact window where `sendRevenueAlert` reads null.",
    faults: [
      "scheduled refreshRevenueCache and sendRevenueAlert concurrently",
      "paused refreshRevenueCache 10ms after clearing the cache",
      "fired sendRevenueAlert inside the null window",
    ],
  },
  {
    id: "deadlock",
    name: "Deadlock",
    emoji: "🪲",
    descriptions: {
      "Web apps":
        "Nightly cleanup job has no index on the column it deletes by. Full table scan locks the entire table. Every write times out.",
      "Fintech":
        "End-of-day reconciliation job locks the transactions table. Every incoming payment times out until it finishes.",
      "Blockchain":
        "A validator holds a write lock waiting for consensus. Consensus is waiting for that same validator to release. Neither moves.",
      "Databases":
        "A migration script locks a table while a background job tries to index it. Both wait forever. Prod goes down.",
      "Cloud infrastructure":
        "A node drain waits for active connections to close. Active connections wait for the node to accept a healthcheck. Neither resolves.",
    },
    tag: "Locks",
    invariant: "Every write should complete within 5 seconds",
    codeFile: "orders.service.js",
    code: [
      ["com", "// No index on account_id — full table scan, locks entire table"], ["br"],
      ["kw", "async function ", "fn", "purgeDeletedAccounts", "punct", "() {"], ["br"],
      ["  ", "kw", "const ", "var", "accounts", "punct", " = ", "kw", "await ", "fn", "getDeletedAccounts", "punct", "();"], ["br"],
      ["  ", "kw", "for ", "punct", "(", "kw", "const ", "var", "account", "kw", " of ", "var", "accounts", "punct", ") {"], ["br"],
      ["    ", "kw", "await ", "fn", "deleteOrdersByAccount", "punct", "(", "var", "account", "punct", ".", "prop", "id", "punct", ");"], ["br"],
      ["  ", "punct", "}"], ["br"],
      ["punct", "}"], ["br"],
      [],
      ["kw", "async function ", "fn", "createOrder", "punct", "(", "var", "userId", "punct", ", ", "var", "items", "punct", ") {"], ["br"],
      ["  ", "kw", "const ", "var", "order", "punct", " = ", "kw", "await ", "fn", "insertOrder", "punct", "(", "var", "userId", "punct", ");"], ["br"],
      ["  ", "kw", "await ", "fn", "insertOrderItems", "punct", "(", "var", "order", "punct", ".", "prop", "id", "punct", ", ", "var", "items", "punct", ");"], ["br"],
      ["punct", "}"], ["br"],
    ],
    verdict: "Antithesis fired `createOrder` while `purgeDeletedAccounts` was holding the table lock — reproducing a collision that only happens when both jobs run at the same time.",
    faults: [
      "started purgeDeletedAccounts at full table scan",
      "queued createOrder behind the table lock",
      "let lock_timeout expire before the scan finished",
    ],
  },
  {
    id: "ordering",
    name: "Out of Order Event",
    emoji: "🦋",
    descriptions: {
      "Web apps":
        "User triggers delete account and submit form milliseconds apart. Delete runs first. Submit writes data for a user that no longer exists.",
      "Fintech":
        "A refund event arrives before the original payment is committed. Refund succeeds. Payment never posts. Account balance is wrong.",
      "Blockchain":
        "A block confirmation arrives before the transaction it confirms is indexed. Chain state is inconsistent for 3 minutes.",
      "Databases":
        "A delete event and an insert event arrive in the wrong order. Row gets recreated after deletion. Constraint violated silently.",
      "Cloud infrastructure":
        "A scale-down event fires before a health check completes. Instance is terminated mid-request. 500s with no trace.",
    },
    tag: "Causality",
    invariant: "A deleted user should never have new data written to them",
    codeFile: "event.handler.js",
    code: [
      ["kw", "async function ", "fn", "handleEvent", "punct", "(", "var", "userId", "punct", ", ", "var", "event", "punct", ") {"], ["br"],
      ["  ", "kw", "if ", "punct", "(", "var", "event", "punct", ".", "prop", "type", "punct", " === ", "str", "'delete_account'", "punct", ") {"], ["br"],
      ["    ", "kw", "await ", "fn", "deleteUserData", "punct", "(", "var", "userId", "punct", ");"], ["br"],
      ["    ", "kw", "await ", "fn", "markAccountDeleted", "punct", "(", "var", "userId", "punct", ");"], ["br"],
      ["  ", "punct", "}"], ["br"],
      [],
      ["  ", "kw", "if ", "punct", "(", "var", "event", "punct", ".", "prop", "type", "punct", " === ", "str", "'submit_form'", "punct", ") {"], ["br"],
      ["    ", "kw", "const ", "var", "user", "punct", " = ", "kw", "await ", "fn", "getUser", "punct", "(", "var", "userId", "punct", ");"], ["br"],
      ["    ", "kw", "await ", "fn", "saveFormSubmission", "punct", "(", "var", "user", "punct", ".", "prop", "id", "punct", ", ", "var", "event", "punct", ".", "prop", "data", "punct", ");"], ["br"],
      ["    ", "kw", "await ", "fn", "sendConfirmationEmail", "punct", "(", "var", "user", "punct", ".", "prop", "email", "punct", ");"], ["br"],
      ["  ", "punct", "}"], ["br"],
      ["punct", "}"], ["br"],
    ],
    verdict: "Antithesis reordered these two events — delivering `delete_account` before `submit_form` in a sequence your code never anticipated.",
    faults: [
      "delayed submit_form 50ms on the wire",
      "delivered delete_account first to the server",
      "released submit_form after the user was wiped",
    ],
  },
  {
    id: "zombie",
    name: "Orphaned Job",
    emoji: "🦟",
    descriptions: {
      "Web apps":
        "Worker crashes mid-job. Restarts and sees the job already marked “processing.” Assumes someone else is handling it. Nobody is. Job never completes.",
      "Fintech":
        "A settlement job crashes mid-run. Restarts and sees the batch marked “processing.” Skips it. Settlements never post.",
      "Blockchain":
        "A sync job crashes while indexing a block. Restarts, sees the block marked “synced.” Skips it. That block is missing from the index forever.",
      "Databases":
        "A vacuum job crashes mid-table. Restarts and sees the table marked “in progress.” Skips it. Dead rows accumulate for weeks.",
      "Cloud infrastructure":
        "A provisioning job crashes mid-deploy. Restarts, sees the environment marked “deploying.” Skips it. Instance is half-configured and serving traffic.",
    },
    tag: "Failure modes",
    invariant: "Every job that starts should eventually complete",
    codeFile: "worker.js",
    code: [
      ["kw", "async function ", "fn", "processJob", "punct", "(", "var", "job", "punct", ") {"], ["br"],
      ["  ", "kw", "await ", "fn", "updateJobStatus", "punct", "(", "var", "job", "punct", ".", "prop", "id", "punct", ", ", "str", "'processing'", "punct", ");"], ["br"],
      ["  ", "kw", "await ", "fn", "doWork", "punct", "(", "var", "job", "punct", ");"], ["br"],
      ["  ", "kw", "await ", "fn", "updateJobStatus", "punct", "(", "var", "job", "punct", ".", "prop", "id", "punct", ", ", "str", "'complete'", "punct", ");"], ["br"],
      ["punct", "}"], ["br"],
      [],
      ["kw", "async function ", "fn", "startWorker", "punct", "() {"], ["br"],
      ["  ", "kw", "const ", "var", "jobs", "punct", " = ", "kw", "await ", "fn", "getJobsByStatus", "punct", "(", "str", "'processing'", "punct", ");"], ["br"],
      ["  ", "kw", "await ", "fn", "processNewJobs", "punct", "();"], ["br"],
      ["punct", "}"], ["br"],
    ],
    verdict: "Antithesis terminated the node at every possible line inside `processJob` — finding the exact point where a crash leaves the job stuck in `processing` forever.",
    faults: [
      "marked job_4821 as 'processing'",
      "killed the worker pod mid-doWork()",
      "restarted worker B without checking the heartbeat",
    ],
  },
  {
    id: "cache",
    name: "Data Corruption",
    emoji: "🐞",
    descriptions: {
      "Web apps":
        "Profile update saves to DB. Network hiccup means downstream services never hear about it. User sees old data for hours.",
      "Fintech":
        "Balance updates in the core ledger. Risk engine is still reading the old value. Approves a transaction it shouldn’t.",
      "Blockchain":
        "Node updates its local state. Peer nodes don’t get the propagation. Two nodes disagree on current chain state for 60 seconds.",
      "Databases":
        "A read replica lags 2 seconds behind the primary. Query hits the replica. Returns data that was just deleted. No error thrown.",
      "Cloud infrastructure":
        "Config update deploys to 9 of 10 instances. One instance misses it. Serves stale config to 10% of traffic for hours.",
    },
    tag: "Consistency",
    invariant: "Downstream views should always reflect the latest write",
    codeFile: "profile.js",
    code: [
      ["kw", "async function ", "fn", "updateUserProfile", "punct", "(", "var", "userId", "punct", ", ", "var", "data", "punct", ") {"], ["br"],
      ["  ", "kw", "await ", "fn", "saveProfile", "punct", "(", "var", "userId", "punct", ", ", "var", "data", "punct", ");               ", "com", "// succeeds — written to DB"], ["br"],
      ["  ", "kw", "await ", "fn", "invalidateOldData", "punct", "(", "var", "userId", "punct", ");"], ["br"],
      ["                                                 ", "com", "// downstream services miss the update"], ["br"],
      ["                                                 ", "com", "// user sees old profile for hours"], ["br"],
      ["punct", "}"], ["br"],
    ],
    verdict: "Antithesis partitioned the network between `saveProfile` and `invalidateOldData` — leaving downstream views permanently out of sync with the DB.",
    faults: [
      "wrote new profile data to the DB",
      "partitioned the network during invalidateOldData()",
      "dropped the invalidation packet — never retried",
    ],
  },
];
