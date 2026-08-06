# Runbook — Code Graph Tools (codebase-memory-mcp + graphify)

Two local code-intelligence tools that index this repo into a queryable graph, so an agent
answers structural questions ("who calls this", "what is dead") from the graph instead of
grepping file by file.

Both run **entirely on this machine**. Nothing about this codebase is sent anywhere. That
property is verified, not assumed — see [Verify the confinement](#verify-the-confinement).

Verified working: 2026-08-05, Ubuntu 22.04 (glibc 2.35), x86_64.

---

## What each tool is for

| | Nodes / edges (this repo) | Best at |
|---|---|---|
| `codebase-memory-mcp` 0.9.0 | 4,289 / 10,386 | Fine-grained structure: functions, classes, call chains, dead code. Exposed to Claude Code as an MCP server with 15 tools. |
| `graphify` 0.9.34 | 1,710 / 2,890 (205 communities) | Zoomed-out shape: which zones the project splits into, surprising couplings, import cycles. Exposed as a `/graphify` skill. |

They are complementary, not redundant. Keep both.

---

## Prerequisites

```bash
uname -m              # expect x86_64
ldd --version         # glibc version — decides which build you need
uv --version          # any version
python3 --version     # 3.10+
```

**glibc decides the build.** The standard `codebase-memory-mcp` release needs glibc **2.38**.
Ubuntu 22.04 ships **2.35**, so it fails at startup with
`version 'GLIBCXX_3.4.32' not found`. Use the `-portable` archive on any host below 2.38.
When in doubt, use `-portable` — it works everywhere.

---

## Install — codebase-memory-mcp

Do **not** use the `curl | bash` installer from the README. Download, verify, then run.

```bash
D=$(mktemp -d)
gh release download v0.9.0 --repo DeusData/codebase-memory-mcp \
  --pattern 'codebase-memory-mcp-linux-amd64-portable.tar.gz' \
  --pattern 'checksums.txt' --dir "$D"

# 1. integrity
cd "$D" && grep 'linux-amd64-portable' checksums.txt | sha256sum -c -

# 2. provenance (sigstore) — must exit 0
gh attestation verify "$D/codebase-memory-mcp-linux-amd64-portable.tar.gz" \
  --repo DeusData/codebase-memory-mcp

# 3. install
tar -xzf "$D/codebase-memory-mcp-linux-amd64-portable.tar.gz" -C "$D"
install -m 0755 "$D/codebase-memory-mcp" ~/.local/bin/codebase-memory-mcp
codebase-memory-mcp --version    # 0.9.0
```

### Graph UI build (optional, separate binary)

The visual UI ships as a different, much larger archive (271 MB — it embeds the frontend).
Install it **alongside** the headless one, under a distinct name, so the MCP server keeps
using the lean build:

```bash
gh release download v0.9.0 --repo DeusData/codebase-memory-mcp \
  --pattern 'codebase-memory-mcp-ui-linux-amd64-portable.tar.gz' --dir "$D"
# verify checksum + attestation exactly as above, then:
tar -xzf "$D/codebase-memory-mcp-ui-linux-amd64-portable.tar.gz" -C "$D/ui"
install -m 0755 "$D/ui/codebase-memory-mcp" ~/.local/bin/codebase-memory-mcp-ui
```

### ⚠️ Never run `codebase-memory-mcp install`

**It has no `--help` and no dry run — `install --help` performs a full install.** It writes
MCP entries, hooks and instruction files into *every* agent it detects (here: Claude Code,
Codex, Gemini CLI, VS Code, Cursor, OpenClaw) and appends a `PATH` line to `~/.bashrc`.

Register only Claude Code, by hand, in `~/.claude.json` — and point it at the **wrapper**,
not the raw binary:

```json
{
  "mcpServers": {
    "codebase-memory-mcp": {
      "command": "/home/erick/.local/bin/codebase-memory-mcp-offline"
    }
  }
}
```

Restart Claude Code for the 15 MCP tools to load.

---

## Install — graphify

```bash
# Pin the tool dirs. Without them, running under the VS Code snap installs into
# ~/snap/code/<rev>/.local/bin (XDG_DATA_HOME is redirected) — outside the real PATH,
# and it disappears on the next snap revision.
export UV_TOOL_DIR="$HOME/.local/share/uv/tools"
export UV_TOOL_BIN_DIR="$HOME/.local/bin"

uv tool install graphifyy        # NOTE: package is "graphifyy", command is "graphify"
graphify install --platform claude   # --platform is required, or it writes to ~20 agents
graphify --version               # 0.9.34
```

`graphify install --platform claude` writes `~/.claude/skills/graphify/` and appends a
3-line block to `~/.claude/CLAUDE.md`.

**Optional — Terraform support.** Without it, `.tf` / `.hcl` / `.tfvars` files parse to zero
nodes and are silently absent from the graph (139 files in this repo):

```bash
uv tool install --force "graphifyy[terraform]"
```

---

## Network confinement

`codebase-memory-mcp` 0.9.0 collects **no telemetry**, but that is not the same as making no
network calls. It starts an `update_check_thread` on every *server* start that shells out to
`curl https://api.github.com/repos/DeusData/codebase-memory-mcp/releases/latest`. No analytics
payload, but it discloses this machine's IP, that the tool runs here, and when. There is no
config key and no env var to disable it.

Since it cannot be turned off, it is confined. **Two wrappers, deliberately different:**

### `~/.local/bin/codebase-memory-mcp-offline` — for the MCP server

Runs the binary inside an unprivileged, loopback-only network namespace
(`unshare -rn`), plus dead-address proxy vars as a second layer. The update check
cannot leave the box; it fails silently by its own design (`curl -sf`). This is the
strong guarantee — use it for anything that does not need to be reached from outside.

Trade-off: `codebase-memory-mcp update` cannot work through it. Updates stay manual, by
calling the real binary directly.

### `~/.local/bin/codebase-memory-mcp-ui-offline` — for the Graph UI

The namespace approach is **unusable** here and it is worth understanding why: the UI serves
HTTP on `127.0.0.1:9749`, and the browser runs *outside* the namespace. Isolating loopback
and then trying to reach it from the host is a contradiction.

So this wrapper keeps the host network namespace and relies on the **proxy layer alone** —
every proxy var points at `127.0.0.1:1`, where nothing listens. It works because the update
check goes through `curl`, and curl honours `https_proxy`.

This is weaker, honestly so: a future version using a statically linked HTTP client, or one
that ignores proxy vars, defeats it. **Re-verify after every upgrade.**

### Telemetry env vars — what is real

Verified by grepping the installed package, not by reading docs:

| Variable | Status |
|---|---|
| `GRAPHIFY_QUERY_LOG_DISABLE=1` | **Real** — read by `graphify/querylog.py`. Keep it. |
| `GRAPHIFY_TELEMETRY=0` | **Placebo** — no code reads it. |
| `DO_NOT_TRACK=1` | **Placebo** — no code in graphify reads it. |

They live in `~/.claude/settings.json` under `env`. The two placebos are harmless but
misleading; a variable that looks like a control but is not is worse than no variable.
`grep -rn <VAR>` in the installed package is the whole check — do it before trusting any
documented switch.

---

## Index this repo

```bash
make graph action=index
```

Both indexers, back to back. Fully local: SQLite + git + tree-sitter for one, tree-sitter AST
for the other. `graphify` runs with `--code-only`, which needs no API key and never calls an LLM.

`graphify` auto-skips files it flags as sensitive (it caught `.env.staging` here).
Output lands in `graphify-out/` (~5.3 MB), excluded via `.git/info/exclude` — a local-only
exclude, so `.gitignore` stays untouched. Commit the graph only if the team wants shared
prebuilt graphs.

After code changes, `graphify update .` refreshes without API cost. The report records the
commit it was built from — compare against `git rev-parse HEAD` to spot a stale graph.

---

## View the graphs

```bash
make graph action=ui-up      # codebase-memory UI  → http://127.0.0.1:9749
make graph action=ui-down
```

graphify needs no server — `graphify-out/graph.html` is a self-contained 1.5 MB page.

### Two traps when opening a browser from this repo

**1. `xdg-open` fails from a VS Code terminal.** The snap injects its own `LD_LIBRARY_PATH`
pointing at `/snap/core20/`, whose libraries are older than the system's, so anything
graphical you launch from that shell dies on `GLIBCXX_3.4.29 not found`. Nothing is wrong
with the tools. Strip the snap vars:

```bash
setsid env -u LD_LIBRARY_PATH -u GTK_PATH -u GIO_MODULE_DIR \
  -u GDK_PIXBUF_MODULE_FILE -u GSETTINGS_SCHEMA_DIR -u LOCPATH \
  /usr/bin/google-chrome "file://$PWD/graphify-out/graph.html" >/dev/null 2>&1 &
```

Simplest fallback: paste the `file://` path straight into the browser's address bar.

**2. The UI server exits after a few seconds if stdin closes.** It is an MCP server on stdio
first and a web server second, so `--ui=true` alone, backgrounded with `< /dev/null`, shuts
down immediately. Stdin must be held open — that is what the `tail -f /dev/null |` in the
make target is for.

---

## Verify the confinement

Run this after **every** upgrade of either tool. An upgrade replaces the binary, not the
wrapper, so the confinement holds structurally — but a new network dependency would fail
silently and you would not notice.

```bash
make graph action=verify
```

Three steps, in this order, and the order is the point:

1. **Control** — traces `curl` against `192.0.2.1` (TEST-NET-1, RFC 5737, never routed on the
   public internet) and asserts the detector *sees* that connection. If it does not, strace is
   broken and every result below is a false pass, so the target aborts here.
2. **MCP server** via `codebase-memory-mcp-offline` — asserts the server actually reached
   `server.start`, then asserts zero external `AF_INET` connections.
3. **Graph UI** via `codebase-memory-mcp-ui-offline` — same two assertions.

### Two traps this target exists to avoid

**Do not verify using CLI mode.** The obvious check —
`strace … codebase-memory-mcp cli index_repository` — is worthless. CLI commands "neither
start nor connect to the coordination daemon", and the update check lives in a thread started
by the **server**. That check passes forever, including on a build that leaks on every server
start. Trace the server, through the wrapper, or you are testing nothing.

**Do not trust a clean trace without a control.** An empty trace file looks identical whether
the tool made no connections or the tracing itself silently failed. The control step is what
separates those two.

The positive half of the A/B — that the *unconfined* binary really does connect to
`140.82.114.6:443` (GitHub) on server start — was established when the wrapper was written and
is documented in its header. It is deliberately **not** re-run here: reproducing it means
actually disclosing this machine to a third party, which is the exact thing being prevented.

By hand:

```bash
strace -f -qq -e trace=connect -o /tmp/cbm.trace \
  ~/.local/bin/codebase-memory-mcp-offline < /dev/null
grep -q 'server.start' /tmp/cbm.log                  # it must have really started
grep AF_INET /tmp/cbm.trace | grep -v '127.0.0.1'    # must be empty
```

Also audit what a new binary embeds:

```bash
strings -n 8 ~/.local/bin/codebase-memory-mcp | grep -oE 'https?://[a-zA-Z0-9./_-]+' | sort -u
```

Expect only `localhost`, `127.0.0.1`, and GitHub release URLs. Anything resembling an
analytics host (posthog, sentry, segment, amplitude) means stop and re-evaluate.

---

## Uninstall

```bash
codebase-memory-mcp uninstall     # removes agent entries, skills, hooks, binary
graphify uninstall --purge        # add --purge to also delete graphify-out/
rm -f ~/.local/bin/codebase-memory-mcp-ui ~/.local/bin/codebase-memory-mcp-*offline
```

`codebase-memory-mcp uninstall` reports the install script beside the binary rather than
deleting it, and asks before removing existing graph indexes.
