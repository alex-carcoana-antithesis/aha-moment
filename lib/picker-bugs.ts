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
        "Flash-sale and inventory sync both update the cart at once. The user checks out with “in stock” items that are already sold out.",
      "Fintech":
        "A trade engine and a risk recalculation run at the same time. One thread writes a new position while another reads the old one, briefly showing a profitable trade as a loss.",
      "Blockchain":
        "Two validator threads update the same mempool entry under load. One sees a transaction as “pending,” the other as “included,” and the node gossips conflicting views to peers.",
      "Databases":
        "A bulk loader and an online migration both touch the same rows. Readers sometimes see new schema, sometimes old, depending on which write won.",
      "Cloud infrastructure":
        "A rolling deploy and an autoscaler both try to change pod counts at once. Some requests land on pods that are terminating and never get a response.",
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
      ["  ", "kw", "if ", "punct", "(", "var", "cachedRevenue", "punct", " === ", "kw", "null", "punct", ") {  ", "com", "// ", "bug", "💥 alert skipped"], ["br"],
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
        "Background image-optimization grabs a global media lock. Product pages trying to attach images pile up and time out.",
      "Fintech":
        "End-of-day ledger rollup holds a lock on the balances table. Real-time payments queue behind it until clients hit “insufficient funds” errors.",
      "Blockchain":
        "A pruning routine holds a lock on state snapshots while compaction runs. Block production slows to a crawl as new blocks wait on storage.",
      "Databases":
        "A nightly VACUUM grabs a lock on a hot table just as an ETL job starts. Application writes stack up until timeouts ripple through the app tier.",
      "Cloud infrastructure":
        "A cluster-wide config push holds a lock in the control plane. New node joins and service updates sit blocked until the push completes.",
    },
    tag: "Locks",
    invariant: "Every write should complete within 5 seconds",
    codeFile: "orders.service.js",
    code: [
      ["com", "// No index on account_id — full table scan, locks entire table"], ["br"],
      ["kw", "async function ", "fn", "purgeDeletedAccounts", "punct", "() {"], ["br"],
      ["  ", "kw", "const ", "var", "accounts", "punct", " = ", "kw", "await ", "fn", "getDeletedAccounts", "punct", "();"], ["br"],
      ["  ", "kw", "for ", "punct", "(", "kw", "const ", "var", "account", "kw", " of ", "var", "accounts", "punct", ") {"], ["br"],
      ["    ", "kw", "await ", "fn", "deleteOrdersByAccount", "punct", "(", "var", "account", "punct", ".", "prop", "id", "punct", ");     ", "com", "// ", "bug", "holds table lock for minutes"], ["br"],
      ["  ", "punct", "}"], ["br"],
      ["punct", "}"], ["br"],
      [],
      ["kw", "async function ", "fn", "createOrder", "punct", "(", "var", "userId", "punct", ", ", "var", "items", "punct", ") {"], ["br"],
      ["  ", "kw", "const ", "var", "order", "punct", " = ", "kw", "await ", "fn", "insertOrder", "punct", "(", "var", "userId", "punct", "); ", "com", "// ", "bug", "waits for lock — times out"], ["br"],
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
        "Password-reset confirmation hits before the “set new password” write lands. The link looks valid, but the user still can’t log in.",
      "Fintech":
        "“Close account” processes before a delayed “ACH deposit” event. The money lands in a closed account and support has to manually unwind it.",
      "Blockchain":
        "A slashing event for a validator arrives before the last reward distribution is applied. The chain records the penalty against an already-removed validator identity.",
      "Databases":
        "A delete from an audit-log table lands before a late-arriving insert for the same key. The supposedly “complete history” is missing the most recent action.",
      "Cloud infrastructure":
        "A “delete load balancer” request clears VIPs before the “drain connections” step runs. Active traffic is abruptly dropped instead of gracefully drained.",
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
      ["    ", "kw", "const ", "var", "user", "punct", " = ", "kw", "await ", "fn", "getUser", "punct", "(", "var", "userId", "punct", ");     ", "com", "// ", "bug", "null — already deleted"], ["br"],
      ["    ", "kw", "await ", "fn", "saveFormSubmission", "punct", "(", "var", "user", "punct", ".", "prop", "id", "punct", ", ", "var", "event", "punct", ".", "prop", "data", "punct", ");"], ["br"],
      ["    ", "kw", "await ", "fn", "sendConfirmationEmail", "punct", "(", "var", "user", "punct", ".", "prop", "email", "punct", ");     ", "com", "// ", "bug", "💥 crashes on null"], ["br"],
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
        "Worker dies halfway through generating a PDF invoice. The order shows “processing” forever and support keeps getting tickets.",
      "Fintech":
        "A batch job reconciling card transactions crashes mid-file. The restart skips that file, so dozens of purchases never settle until an auditor notices.",
      "Blockchain":
        "A node crashes during state-sync of a large range. On restart, the sync task is never resumed, so that node stays permanently a few hundred blocks behind.",
      "Databases":
        "Backup process crashes halfway through a full snapshot. The scheduler marks it “done,” but the next incremental backup silently chains to a non-existent base.",
      "Cloud infrastructure":
        "A log-processing worker dies in the middle of a shard. The orchestrator marks the pod healthy after restart but never reassigns that shard, so a slice of logs is never indexed.",
    },
    tag: "Failure modes",
    invariant: "Every job that starts should eventually complete",
    codeFile: "worker.js",
    code: [
      ["kw", "async function ", "fn", "processJob", "punct", "(", "var", "job", "punct", ") {"], ["br"],
      ["  ", "kw", "await ", "fn", "updateJobStatus", "punct", "(", "var", "job", "punct", ".", "prop", "id", "punct", ", ", "str", "'processing'", "punct", ");"], ["br"],
      ["  ", "kw", "await ", "fn", "doWork", "punct", "(", "var", "job", "punct", ");                   ", "com", "// ", "bug", "pod crashes here"], ["br"],
      ["  ", "kw", "await ", "fn", "updateJobStatus", "punct", "(", "var", "job", "punct", ".", "prop", "id", "punct", ", ", "str", "'complete'", "punct", ");  ", "com", "// ", "bug", "never runs"], ["br"],
      ["punct", "}"], ["br"],
      [],
      ["kw", "async function ", "fn", "startWorker", "punct", "() {"], ["br"],
      ["  ", "kw", "const ", "var", "jobs", "punct", " = ", "kw", "await ", "fn", "getJobsByStatus", "punct", "(", "str", "'processing'", "punct", ");"], ["br"],
      ["  ", "com", "// sees stuck job from last crash — ", "bug", "skips it"], ["br"],
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
        "User profile is updated in the DB, but the CDN cache purge fails silently. For hours, some users see their ex-partner’s name still on shared accounts.",
      "Fintech":
        "A portfolio rebalance writes new weights to the DB, but the quotes cache never invalidates. Advisors stare at dashboards showing yesterday’s allocations with today’s market risk.",
      "Blockchain":
        "A block is committed to disk, but the index for transaction lookups fails to update. Explorers show “transaction not found” for operations that are actually in the chain.",
      "Databases":
        "A replicated DB applies a write, but the binlog shipper drops a segment. Secondaries serve slightly older data that never quite matches the primary.",
      "Cloud infrastructure":
        "Object storage writes complete, but the metadata index update fails. Monitoring shows “green” buckets while some objects are effectively invisible to reads.",
    },
    tag: "Consistency",
    invariant: "Downstream views should always reflect the latest write",
    codeFile: "profile.js",
    code: [
      ["kw", "async function ", "fn", "updateUserProfile", "punct", "(", "var", "userId", "punct", ", ", "var", "data", "punct", ") {"], ["br"],
      ["  ", "kw", "await ", "fn", "saveProfile", "punct", "(", "var", "userId", "punct", ", ", "var", "data", "punct", ");               ", "com", "// succeeds — written to DB"], ["br"],
      ["  ", "kw", "await ", "fn", "invalidateOldData", "punct", "(", "var", "userId", "punct", ");             ", "com", "// ", "bug", "network hiccup — never runs"], ["br"],
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
