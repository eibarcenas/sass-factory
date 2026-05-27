# CI Access to Private `factory-sdk` Repo

The API depends on `factory_auth`, a Python package that lives in the private
[eibarcenas/factory-sdk](https://github.com/eibarcenas/factory-sdk) repo.
Because `GITHUB_TOKEN` is scoped to the current repo only, CI needs a separate
Personal Access Token to clone `factory-sdk` during dependency installation.

---

## How it works

`apps/api/pyproject.toml` declares the dependency as a git URL:

```toml
dependencies = [
    "factory-auth @ git+https://github.com/eibarcenas/factory-sdk.git#subdirectory=python",
    ...
]
```

The CI workflow injects a PAT via an env var and rewrites git URLs before
running `uv pip install -e ".[dev]"`:

```yaml
- name: Install Python 3.13 + API deps
  env:
    GH_PAT: ${{ secrets.GH_PAT }}
  run: |
    cd apps/api
    uv venv --python 3.13
    git config --global url."https://x-access-token:${GH_PAT}@github.com/".insteadOf "https://github.com/"
    uv pip install -e ".[dev]"
```

The `insteadOf` rewrite is transparent — all `https://github.com/` clones in
that shell session use the token automatically.

---

## One-time setup

### 1. Create the PAT

1. Go to **github.com/settings/tokens → Generate new token (classic)**
2. Name: `sass-factory-ci`
3. Expiration: 90 days (renew on expiry — see rotation section below)
4. Scopes: check **`repo`** (gives read access to all private repos you own)
5. Click **Generate token** and copy it immediately

### 2. Add the secret to sass-factory

Go to **github.com/eibarcenas/sass-factory → Settings → Secrets and variables →
Actions → New repository secret**:

| Field | Value |
|-------|-------|
| Name  | `GH_PAT` |
| Value | *(paste the token)* |

Click **Add secret**.

---

## Token rotation

GitHub can send an email before a classic PAT expires. When it does:

1. Go to **github.com/settings/tokens** and regenerate `sass-factory-ci`
2. Update the secret:

```bash
echo "NEW_TOKEN_VALUE" | gh secret set GH_PAT --repo eibarcenas/sass-factory
```

Or update it via the GitHub UI (Settings → Secrets → GH_PAT → Update).

---

## If CI fails with "could not read Password"

This means the token is missing, expired, or lacks `repo` scope. Check:

```bash
gh secret list --repo eibarcenas/sass-factory   # confirm GH_PAT exists
```

Then re-create the token with the steps above and update the secret.

---

## Local development

No token needed locally. `uv` or `pip` uses your global git credentials
(SSH key or gh CLI auth) when you run:

```bash
cd apps/api
uv pip install -e ".[dev]"
# or
pip install -e ".[dev]"
```

Make sure you have at least read access to `eibarcenas/factory-sdk` with your
GitHub account.
