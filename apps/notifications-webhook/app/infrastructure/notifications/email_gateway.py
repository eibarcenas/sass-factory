"""
Transactional email via SMTP.

Required env vars:
  SMTP_HOST          e.g. smtp.gmail.com
  SMTP_PORT          default 587 (STARTTLS)
  SMTP_USER          sender login
  SMTP_PASS          app password
  SMTP_FROM          display name + address, e.g. "catalog.mx <hola@catalog.mx>"
  ADMIN_NOTIFY_EMAIL address that receives new-submission alerts

All vars are optional — if SMTP_HOST is not set, emails are skipped silently
so the API never fails because of a missing email config.
"""
import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

SMTP_HOST  = os.getenv("SMTP_HOST", "")
SMTP_PORT  = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER  = os.getenv("SMTP_USER", "")
SMTP_PASS  = os.getenv("SMTP_PASS", "")
SMTP_FROM  = os.getenv("SMTP_FROM", SMTP_USER)
ADMIN_EMAIL = os.getenv("ADMIN_NOTIFY_EMAIL", "")

STOREFRONT_URL = os.getenv("STOREFRONT_URL", "https://catalog.mx")
ADMIN_URL      = os.getenv("ADMIN_URL", "https://admin.catalog.mx")


def _send(to: str, subject: str, html: str) -> None:
    """Send one email. Logs and swallows errors — never raises."""
    if not SMTP_HOST or not to:
        logger.info("Email skipped (SMTP_HOST not configured or empty recipient)")
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = SMTP_FROM
        msg["To"]      = to
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_FROM, to, msg.as_string())

        logger.info("Email sent to %s — %s", to, subject)
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to, exc)


def send_catalog_activated(owner_email: str, business_name: str, slug: str) -> None:
    """Notify the owner that their catalog is now live."""
    catalog_url = f"{STOREFRONT_URL}/{slug}"
    _send(
        to=owner_email,
        subject=f"¡Tu catálogo está listo! — {business_name}",
        html=f"""
<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#FAF9F6;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="520" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:12px;border:1px solid #E4E4E7;overflow:hidden;">

        <tr><td style="padding:32px 40px 0;">
          <p style="margin:0;font-size:13px;color:#71717A;letter-spacing:.05em;text-transform:uppercase;">
            catalog.mx
          </p>
        </td></tr>

        <tr><td style="padding:24px 40px 0;">
          <h1 style="margin:0;font-size:24px;font-weight:700;color:#18181B;line-height:1.2;">
            ¡Tu catálogo está listo!
          </h1>
        </td></tr>

        <tr><td style="padding:16px 40px 0;">
          <p style="margin:0;font-size:15px;color:#52525B;line-height:1.6;">
            <strong style="color:#18181B;">{business_name}</strong> ya está activo
            y visible para tus clientes. Comparte tu link y empieza a recibir pedidos.
          </p>
        </td></tr>

        <tr><td style="padding:28px 40px;">
          <a href="{catalog_url}"
             style="display:inline-block;background:#18181B;color:#fff;text-decoration:none;
                    padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
            Ver mi catálogo →
          </a>
        </td></tr>

        <tr><td style="padding:0 40px 8px;">
          <p style="margin:0;font-size:13px;color:#A1A1AA;">
            Tu link:
            <a href="{catalog_url}" style="color:#18181B;">{catalog_url}</a>
          </p>
        </td></tr>

        <tr><td style="padding:24px 40px;border-top:1px solid #F4F4F5;margin-top:24px;">
          <p style="margin:0;font-size:12px;color:#A1A1AA;">
            catalog.mx · Catálogos digitales para negocios locales
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
""",
    )


def send_review_submitted(business_name: str, slug: str, owner_email: str) -> None:
    """Notify the admin team that a new catalog is waiting for review."""
    if not ADMIN_EMAIL:
        return
    solicitudes_url = f"{ADMIN_URL}/clientes"
    _send(
        to=ADMIN_EMAIL,
        subject=f"[catalog.mx] {business_name} envió su catálogo para revisión",
        html=f"""
<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#FAF9F6;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="520" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:12px;border:1px solid #E4E4E7;overflow:hidden;">

        <tr><td style="padding:32px 40px 0;">
          <p style="margin:0;font-size:13px;color:#71717A;letter-spacing:.05em;text-transform:uppercase;">
            catalog.mx · Admin
          </p>
        </td></tr>

        <tr><td style="padding:24px 40px 0;">
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#18181B;">
            Nuevo catálogo en revisión
          </h1>
        </td></tr>

        <tr><td style="padding:16px 40px 0;">
          <table cellpadding="0" cellspacing="0"
                 style="background:#F4F4F5;border-radius:8px;width:100%;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#18181B;">
                {business_name}
              </p>
              <p style="margin:0;font-size:13px;color:#71717A;">
                {owner_email} · slug: {slug}
              </p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:24px 40px;">
          <a href="{solicitudes_url}"
             style="display:inline-block;background:#18181B;color:#fff;text-decoration:none;
                    padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
            Ver solicitudes →
          </a>
        </td></tr>

        <tr><td style="padding:0 40px 24px;">
          <p style="margin:0;font-size:12px;color:#A1A1AA;">
            catalog.mx · panel de administración
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
""",
    )


def send_prospect_created(payload: dict) -> None:
    if not ADMIN_EMAIL:
        return
    business_id = payload.get("businessId", "")
    contact = payload.get("contactName") or payload.get("email") or payload.get("phone") or "Nuevo prospecto"
    _send(
        to=ADMIN_EMAIL,
        subject=f"[catalog.mx] Nuevo prospecto — {business_id}",
        html=f"""
<html lang="es">
<body>
  <h1>Nuevo prospecto</h1>
  <p><strong>Negocio:</strong> {business_id}</p>
  <p><strong>Contacto:</strong> {contact}</p>
  <p><strong>Teléfono:</strong> {payload.get("phone") or "N/A"}</p>
  <p><strong>Email:</strong> {payload.get("email") or "N/A"}</p>
</body>
</html>
""",
    )


def send_demo_accepted(payload: dict) -> None:
    if not ADMIN_EMAIL:
        return
    business_id = payload.get("businessId", "")
    owner_email = payload.get("ownerEmail", "")
    _send(
        to=ADMIN_EMAIL,
        subject=f"[catalog.mx] Demo aceptado — {business_id}",
        html=f"""
<html lang="es">
<body>
  <h1>Demo aceptado</h1>
  <p><strong>Negocio:</strong> {business_id}</p>
  <p><strong>Owner:</strong> {owner_email}</p>
</body>
</html>
""",
    )
