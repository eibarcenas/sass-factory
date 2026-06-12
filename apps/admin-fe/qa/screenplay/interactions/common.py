from __future__ import annotations

import re

from playwright.sync_api import expect

from screenplay.abilities.browse_the_web import BrowseTheWeb
from screenplay.actor import Actor, Performable
from screenplay.target import Target


def _page(actor: Actor):
    return actor.ability_to(BrowseTheWeb).page


class Navigate:
    """Navigate the browser to a path relative to the base URL."""

    def __init__(self, path: str) -> None:
        self._path = path

    @staticmethod
    def to(path: str) -> "Navigate":
        return Navigate(path)

    def perform_as(self, actor: Actor) -> None:
        _page(actor).goto(self._path)


class Click:
    """Click on a target element."""

    def __init__(self, target: Target) -> None:
        self._target = target

    @staticmethod
    def on(target: Target) -> "Click":
        return Click(target)

    def perform_as(self, actor: Actor) -> None:
        self._target.found_in(_page(actor)).click()


class Enter:
    """Fill text into a target element."""

    def __init__(self, text: str) -> None:
        self._text = text
        self._target: Target | None = None

    @staticmethod
    def the_text(text: str) -> "Enter":
        return Enter(text)

    def into(self, target: Target) -> "Enter":
        self._target = target
        return self

    def perform_as(self, actor: Actor) -> None:
        assert self._target is not None, "Enter.the_text(...) must be followed by .into(target)"
        self._target.found_in(_page(actor)).fill(self._text)


class SelectOption:
    """Select an option by its visible label from a <select> target."""

    def __init__(self, label: str) -> None:
        self._label = label
        self._target: Target | None = None

    @staticmethod
    def labelled(label: str) -> "SelectOption":
        return SelectOption(label)

    def from_(self, target: Target) -> "SelectOption":
        self._target = target
        return self

    def perform_as(self, actor: Actor) -> None:
        assert self._target is not None, "SelectOption.labelled(...) must be followed by .from_(target)"
        self._target.found_in(_page(actor)).select_option(label=self._label)


class Check:
    """Check a checkbox target."""

    def __init__(self, target: Target) -> None:
        self._target = target

    @staticmethod
    def the(target: Target) -> "Check":
        return Check(target)

    def perform_as(self, actor: Actor) -> None:
        self._target.found_in(_page(actor)).check()


class SetInputFiles:
    """Attach a file to a file input target."""

    def __init__(self, path: str) -> None:
        self._path = path
        self._target: Target | None = None

    @staticmethod
    def at_path(path: str) -> "SetInputFiles":
        return SetInputFiles(path)

    def into(self, target: Target) -> "SetInputFiles":
        self._target = target
        return self

    def perform_as(self, actor: Actor) -> None:
        assert self._target is not None, "SetInputFiles.at_path(...) must be followed by .into(target)"
        self._target.found_in(_page(actor)).set_input_files(self._path)


class WaitUntilVisible:
    """Wait until a target becomes visible."""

    def __init__(self, target: Target, timeout: float | None = None) -> None:
        self._target = target
        self._timeout = timeout

    @staticmethod
    def the(target: Target, timeout: float | None = None) -> "WaitUntilVisible":
        return WaitUntilVisible(target, timeout)

    def perform_as(self, actor: Actor) -> None:
        expect(self._target.found_in(_page(actor))).to_be_visible(timeout=self._timeout)


class WaitUntilEnabled:
    """Wait until a target becomes enabled."""

    def __init__(self, target: Target, timeout: float | None = None) -> None:
        self._target = target
        self._timeout = timeout

    @staticmethod
    def the(target: Target, timeout: float | None = None) -> "WaitUntilEnabled":
        return WaitUntilEnabled(target, timeout)

    def perform_as(self, actor: Actor) -> None:
        expect(self._target.found_in(_page(actor))).to_be_enabled(timeout=self._timeout)


class WaitUntilHasClass:
    """Wait until a target's class attribute matches a regex pattern."""

    def __init__(self, pattern: str, timeout: float | None = None) -> None:
        self._pattern = pattern
        self._timeout = timeout
        self._target: Target | None = None

    @staticmethod
    def matching(pattern: str, timeout: float | None = None) -> "WaitUntilHasClass":
        return WaitUntilHasClass(pattern, timeout)

    def on(self, target: Target) -> "WaitUntilHasClass":
        self._target = target
        return self

    def perform_as(self, actor: Actor) -> None:
        assert self._target is not None, "WaitUntilHasClass.matching(...) must be followed by .on(target)"
        expect(self._target.found_in(_page(actor))).to_have_class(
            re.compile(self._pattern), timeout=self._timeout
        )


class WaitForJsCondition:
    """Wait until a JS expression evaluates to a truthy value in the page."""

    def __init__(self, expression: str, timeout: float | None = None) -> None:
        self._expression = expression
        self._timeout = timeout

    @staticmethod
    def to_be_true(expression: str, timeout: float | None = None) -> "WaitForJsCondition":
        return WaitForJsCondition(expression, timeout)

    def perform_as(self, actor: Actor) -> None:
        _page(actor).wait_for_function(self._expression, timeout=self._timeout)


class WaitForResponse:
    """Wait for a matching network response while performing another activity."""

    def __init__(self, url_contains: str, method: str | None = None) -> None:
        self._url_contains = url_contains
        self._method = method
        self._remember_as: str | None = None
        self._activity: Performable | None = None

    @staticmethod
    def matching(url_contains: str, method: str | None = None) -> "WaitForResponse":
        return WaitForResponse(url_contains, method)

    def and_remember_as(self, key: str) -> "WaitForResponse":
        self._remember_as = key
        return self

    def while_performing(self, activity: Performable) -> "WaitForResponse":
        self._activity = activity
        return self

    def _matches(self, response) -> bool:
        if self._url_contains not in response.url:
            return False
        if self._method and response.request.method != self._method:
            return False
        return True

    def perform_as(self, actor: Actor) -> None:
        assert self._activity is not None, (
            "WaitForResponse.matching(...) must be followed by .while_performing(activity)"
        )
        page = _page(actor)
        with page.expect_response(self._matches) as response_info:
            self._activity.perform_as(actor)
        if self._remember_as:
            actor.remember(self._remember_as, response_info.value)
