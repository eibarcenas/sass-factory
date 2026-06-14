"""Live, black-box verification of POST /api/v1/auth/claims/resolve.

Runs against a *real* identity-api process wired to the Firebase Auth +
Firestore emulators (no mocks): creates real emulator users, seeds real
Firestore business docs, mints real ID tokens, and asserts the HTTP
behaviour of the running service.

This is the regression guard for the self-registration redirect loop:
businesses created with status="pending" must be claimable (HTTP 200,
resolved=True), while terminal states (e.g. "suspended") must stay blocked
(HTTP 403).

Env (all optional, defaults match test/live/docker-compose.yml + Makefile):
  IDENTITY_API_URL        default http://127.0.0.1:8001
  FIREBASE_AUTH_EMULATOR_HOST  default localhost:9099
  FIRESTORE_EMULATOR_HOST default localhost:8080
  GOOGLE_CLOUD_PROJECT    default demo-eguru

Exit code 0 = all scenarios pass, 1 = at least one failed.
"""
import json
import os
import sys
import urllib.error
import urllib.request
import uuid

from google.cloud import firestore

PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT", "demo-eguru")
API_URL = os.getenv("IDENTITY_API_URL", "http://127.0.0.1:8001").rstrip("/")
AUTH_HOST = os.getenv("FIREBASE_AUTH_EMULATOR_HOST", "localhost:9099")
os.environ.setdefault("FIRESTORE_EMULATOR_HOST", os.getenv("FIRESTORE_EMULATOR_HOST", "localhost:8080"))

SIGNUP_URL = f"http://{AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake"
RESOLVE_URL = f"{API_URL}/api/v1/auth/claims/resolve"

db = firestore.Client(project=PROJECT)


def _post(url, body, headers=None):
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        method="POST",
        headers={"Content-Type": "application/json", **(headers or {})},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read() or b"{}")
    except urllib.error.HTTPError as exc:
        return exc.code, json.loads(exc.read() or b"{}")


def _new_owner():
    """Create a brand-new emulator user (no custom claims yet) and return
    (uid, id_token) — i.e. a freshly signed-in owner whose claims have not
    propagated, exactly the state that triggers /auth/claims/resolve."""
    email = f"owner-{uuid.uuid4().hex[:8]}@example.com"
    status, body = _post(SIGNUP_URL, {"email": email, "password": "Passw0rd!", "returnSecureToken": True})
    assert status == 200, f"emulator signUp failed: {status} {body}"
    return email, body["localId"], body["idToken"]


def _seed_business(slug, email, uid, status):
    db.collection("businesses").document(slug).set({
        "slug": slug,
        "name": "Heladería El Pingüino",
        "ownerEmail": email,
        "ownerUid": uid,
        "status": status,
    })


def _scenario(label, status, expect_code, expect_resolved):
    email, uid, token = _new_owner()
    slug = f"heladeria-{uuid.uuid4().hex[:8]}"
    _seed_business(slug, email, uid, status)
    code, body = _post(RESOLVE_URL, {}, {"Authorization": f"Bearer {token}"})

    ok = code == expect_code
    if expect_resolved:
        ok = ok and body.get("resolved") is True and body.get("role") == "OWNER" and body.get("businessId") == slug
    print(f"[{'PASS' if ok else 'FAIL'}] {label}: status={status!r} -> HTTP {code} {json.dumps(body)}")
    return ok


def main():
    print(f"== LIVE verification: {RESOLVE_URL} (real router + middleware + Firestore) ==")
    results = [
        _scenario("self-registered pending is claimable (the bug)", "pending", 200, True),
        _scenario("active is claimable", "active", 200, True),
        _scenario("suspended stays blocked", "suspended", 403, False),
    ]
    passed = all(results)
    print("RESULT:", "ALL PASS" if passed else "SOME FAILED")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
