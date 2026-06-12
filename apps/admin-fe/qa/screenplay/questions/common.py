from __future__ import annotations

from typing import Any

from screenplay.abilities.browse_the_web import BrowseTheWeb
from screenplay.actor import Actor


class CurrentUrl:
    """The URL currently loaded in the actor's browser."""

    @staticmethod
    def value() -> "CurrentUrl":
        return CurrentUrl()

    def answered_by(self, actor: Actor) -> str:
        return actor.ability_to(BrowseTheWeb).page.url


class Note:
    """A value the actor previously remembered under a key."""

    def __init__(self, key: str) -> None:
        self._key = key

    @staticmethod
    def called(key: str) -> "Note":
        return Note(key)

    def answered_by(self, actor: Actor) -> Any:
        return actor.recall(self._key)


class ResponseStatus:
    """The HTTP status code of a network response the actor remembered."""

    def __init__(self, key: str) -> None:
        self._key = key

    @staticmethod
    def of(key: str) -> "ResponseStatus":
        return ResponseStatus(key)

    def answered_by(self, actor: Actor) -> int:
        return actor.recall(self._key).status
