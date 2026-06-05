"""
One-time migration: map old 11-value BusinessStatus to the new 3-value model.

  pending  ← draft, pending_review, review, store, sent, accepted
  active   ← active  (unchanged)
  inactive ← suspended, expired, rejected, archived

Run with:
  cd apps/stores-api
  GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json uv run python scripts/migrate_statuses.py
"""
import os
import sys

TO_PENDING  = {"draft", "pending_review", "review", "store", "sent", "accepted"}
TO_INACTIVE = {"suspended", "expired", "rejected", "archived"}


def main():
    import firebase_admin
    from firebase_admin import credentials, firestore

    creds_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if creds_path:
        firebase_admin.initialize_app(credentials.Certificate(creds_path))
    else:
        firebase_admin.initialize_app()

    db = firestore.client()
    docs = list(db.collection("businesses").stream())
    print(f"Found {len(docs)} businesses")

    updated = skipped = 0
    for doc in docs:
        data = doc.to_dict() or {}
        current = data.get("status", "")
        if current in TO_PENDING:
            doc.reference.update({"status": "pending"})
            print(f"  {doc.id}: {current!r} → 'pending'")
            updated += 1
        elif current in TO_INACTIVE:
            doc.reference.update({"status": "inactive"})
            print(f"  {doc.id}: {current!r} → 'inactive'")
            updated += 1
        elif current == "active":
            skipped += 1
        else:
            print(f"  {doc.id}: unknown status {current!r} — skipping", file=sys.stderr)

    print(f"\nDone. Updated: {updated}, Skipped (already active): {skipped}")


if __name__ == "__main__":
    main()
