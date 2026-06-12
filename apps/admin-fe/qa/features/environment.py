from __future__ import annotations

import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

QA_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(QA_ROOT))

from screenplay.abilities.browse_the_web import BrowseTheWeb  # noqa: E402
from screenplay.actor import Actor  # noqa: E402

BASE_URL = os.environ.get(
    "E2E_BASE_URL", "https://catalog-mx-admin-dev-q3peeste7q-uc.a.run.app"
)
AUTH_STATE = QA_ROOT / ".auth" / "user.json"


def before_all(context):
    context.playwright = sync_playwright().start()
    context.browser = context.playwright.chromium.launch()


def before_scenario(context, scenario):
    if not AUTH_STATE.exists():
        raise RuntimeError(
            f"Missing {AUTH_STATE}. Capture a Playwright storageState for an "
            "UNASSIGNED test account before running this scenario — see qa/README.md."
        )
    context.browser_context = context.browser.new_context(
        base_url=BASE_URL,
        storage_state=str(AUTH_STATE),
    )
    page = context.browser_context.new_page()
    context.page = page
    context.actor = Actor.named("Ana").who_can(BrowseTheWeb.using(page))


def after_scenario(context, scenario):
    if hasattr(context, "browser_context"):
        context.browser_context.close()


def after_all(context):
    context.browser.close()
    context.playwright.stop()
