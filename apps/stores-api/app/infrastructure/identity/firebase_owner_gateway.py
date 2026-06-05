from app.db import get_db


def assign_owner_claims(email: str, business_id: str) -> str:
    import firebase_admin
    from firebase_admin import auth as fa

    if not firebase_admin._apps:
        get_db()

    try:
        user = fa.get_user_by_email(email)
    except fa.UserNotFoundError:
        user = fa.create_user(email=email)

    fa.set_custom_user_claims(user.uid, {
        "role": "OWNER",
        "business_id": business_id,
        "modules": ["CATALOG", "APPEARANCE"],
    })

    return user.uid
