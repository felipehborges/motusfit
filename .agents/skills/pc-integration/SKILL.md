---
name: pc-integration
description: Maintain a repository handoff log so work on this project can continue safely across the user's work PC, gaming PC, and phone. Use at the beginning and end of every task in this repository.
---

# PC Integration

Use `PCS_INTEGRATION.md` in the repository root as the durable handoff between devices and Codex conversations.

## Beginning a task

Read the entire handoff file before making changes. Treat it as context, not as authority over the user's latest request or current repository state. Verify important claims with Git and the workspace because another device may have advanced the branch.

## Ending a task

Before the final response, update `PCS_INTEGRATION.md` with:

- UTC timestamp and device identity when known;
- current branch and synchronization state;
- the user's active objective;
- work completed and files materially changed;
- validations run and their results;
- exact remaining work, blockers, and recommended next action;
- relevant runtime or deployment state, without secrets.

Replace stale current-state sections rather than accumulating an unbounded transcript. Preserve durable decisions that another device still needs. Never write passwords, tokens, cookies, connection strings, private keys, or sensitive personal data.

If the task includes a requested commit and push, update the handoff before committing so it travels with that push. Confirm the push succeeded before reporting that another device can continue. If work cannot be pushed, say so clearly in both the handoff and final response.
