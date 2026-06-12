from __future__ import annotations

from playwright.sync_api import Page


class BrowseTheWeb:
    """The ability to interact with a web page via Playwright."""

    def __init__(self, page: Page) -> None:
        self.page = page

    @staticmethod
    def using(page: Page) -> "BrowseTheWeb":
        return BrowseTheWeb(page)
