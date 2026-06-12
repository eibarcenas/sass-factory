from __future__ import annotations

from typing import Callable

from playwright.sync_api import Locator, Page


class Target:
    """A named, reusable locator for an element on the page."""

    def __init__(self, description: str, locate: Callable[[Page], Locator]) -> None:
        self.description = description
        self._locate = locate

    @staticmethod
    def the(description: str) -> "_TargetBuilder":
        return _TargetBuilder(description)

    def found_in(self, page: Page) -> Locator:
        return self._locate(page)

    def __str__(self) -> str:
        return self.description


class _TargetBuilder:
    def __init__(self, description: str) -> None:
        self._description = description

    def located_by(self, locate: Callable[[Page], Locator]) -> Target:
        return Target(self._description, locate)
