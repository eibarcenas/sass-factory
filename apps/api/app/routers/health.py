from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "version": "0.1.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "stack": "FastAPI + Python 3.12",
    }


@router.post("/auth/google-signin")
async def google_signin_lookup(request: dict = {}):
    """Called after Google Sign-In to check if user has a pending owner activation.
    If found in pending_owners collection, set custom claims and return role.
    """
    email = request.get("email")
    if not email:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="email required")

    try:
        from app.db import get_db
        import firebase_admin
        from firebase_admin import auth as fa

        db = get_db()
        pending = db.collection("pending_owners").document(email).get()

        if pending.exists:
            data = pending.to_dict()
            # Find the Firebase user and set claims
            try:
                user = fa.get_user_by_email(email)
                fa.set_custom_user_claims(user.uid, {
                    "role": data["role"],
                    "business_id": data["businessId"],
                    "modules": data.get("modules", ["CATALOG", "APPEARANCE"]),
                })
                # Remove from pending
                db.collection("pending_owners").document(email).delete()
                return {"role": data["role"], "businessId": data["businessId"], "claimsSet": True}
            except Exception:
                return {"role": data["role"], "businessId": data["businessId"], "claimsSet": False}

        return {"role": None, "message": "No pending activation for this email"}
    except Exception as e:
        return {"role": None, "error": str(e)}
