# CLAUDE.md

The working rules for this repository live in [AGENTS.md](./AGENTS.md). Read that file first, every session.

Quick reminders:

- Requirements and their IDs: `docs/SRS.md`. Build only the scope of the task you were given.
- Access rules live in `src/access/` and are unit-tested. Never re-implement one inside a route.
- Never invent school facts. Use a bracketed placeholder and record it in `docs/CONTENT_TODO.md`.
- Done means `pnpm check` passes and the page has been looked at on a 360 px viewport.
