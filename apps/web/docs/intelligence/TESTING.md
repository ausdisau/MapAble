# Testing

Run the Mainframe unit suite, TypeScript checks, build, and static isolation
scan. The suite asserts synthetic-only gating, policy denials, no block or
access requirement bypass, prompt hash stability, schema validation,
injection escalation, and no database/provider/network/write capability in
the Mainframe tree.

Any hard-safety failure means Phase A is not ready.
