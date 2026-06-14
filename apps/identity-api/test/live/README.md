# Live test — identity-api auth flows

End-to-end verification of `POST /api/v1/auth/claims/resolve` against the
**real** service wired to the Firebase Auth + Firestore emulators. No mocks:
real emulator users, real Firestore docs, real ID tokens, real middleware.

This is the regression guard for the self-registration redirect loop — a
business created with `status="pending"` must be claimable, while terminal
states (e.g. `suspended`) must stay blocked.

## Run

```bash
make test-live          # from repo root
# or
bash apps/identity-api/test/live/run.sh
```

`run.sh` boots the emulators in Docker, starts identity-api against them with
the dev-auth bypass **off**, runs the scenarios, and always tears everything
down. Exit code is non-zero if any scenario fails.

## Requirements

- Docker (+ compose) — the emulator image bundles JDK 17, so nothing Java is
  installed on the host.
- `uv`, with deps synced once: `cd apps/identity-api && uv sync --extra dev`.

## Why Docker / firebase-tools 12.9.1

firebase-tools ≥ 14 hard-requires JDK 21. Pinning 12.9.1 inside an image with
JDK 17 keeps the test portable and independent of whatever Java the host has.
