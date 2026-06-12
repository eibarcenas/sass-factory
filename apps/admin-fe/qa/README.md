# admin-fe QA automation

E2E tests for `apps/admin-fe`, written with [`behave`](https://behave.readthedocs.io/)
(Gherkin) + [Playwright (Python)](https://playwright.dev/python/), structured using the
[Screenplay pattern](https://serenity-js.org/handbook/design/screenplay-pattern.html)
(Actors, Abilities, Tasks, Interactions, Questions).

## Layout

```
qa/
├── features/
│   ├── environment.py        # behave hooks: Playwright lifecycle, Actor setup
│   ├── registration.feature  # Gherkin scenarios
│   └── steps/                 # step definitions, map Gherkin -> Screenplay Tasks
├── pages/
│   └── onboarding_page.py    # Targets (locators) for the onboarding stepper
├── screenplay/
│   ├── actor.py               # Actor, Performable, Answerable
│   ├── target.py              # Target (named, reusable locator)
│   ├── abilities/              # BrowseTheWeb (wraps a Playwright Page)
│   ├── interactions/           # low-level actions: Click, Enter, WaitFor*, ...
│   ├── questions/               # read state: CurrentUrl, Note, ResponseStatus
│   └── tasks/                    # high-level, domain Tasks (e.g. CompleteTheBusinessStep)
├── fixtures/
│   └── test-image.jpg         # 1x1px JPEG used for logo/product image uploads
└── .auth/                      # storageState files (gitignored, not committed)
```

## Setup

```bash
cd apps/admin-fe/qa
uv sync
uv run playwright install chromium
```

## Capturing an authenticated session

The onboarding stepper requires a signed-in Firebase user whose role is still
`UNASSIGNED`. Playwright's `storageState` captures cookies, localStorage **and**
IndexedDB (where the Firebase Auth SDK persists the session), so a saved session
restores `auth.currentUser` correctly.

To capture one:

```bash
cd apps/admin-fe/qa
uv run playwright codegen --save-storage=.auth/user.json $E2E_BASE_URL
```

In the browser window that opens:

1. Go through Google Sign-In to create/sign in to a **new** seller account
   (role `UNASSIGNED`, redirected to `/es/onboarding/business`).
2. Close the browser window — `codegen` writes `.auth/user.json` on close.

`.auth/` is gitignored; each developer/CI run needs its own captured session.

## Running the tests

```bash
cd apps/admin-fe/qa
uv run behave
```

Override the target environment with `E2E_BASE_URL` (defaults to the dev
Cloud Run admin-fe URL):

```bash
E2E_BASE_URL=http://localhost:3000 uv run behave
```

## One-shot limitation

Completing registration assigns the account the `OWNER` role and a
`business_id` custom claim. After that, `RegisterPage` / `RequireOnboarding`
redirect signed-in non-`UNASSIGNED` users away from `/onboarding/business`, so
the `registration.feature` scenario can only run once per captured session.
Re-running it requires capturing a fresh `.auth/user.json` for a new
`UNASSIGNED` account.
