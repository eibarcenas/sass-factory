from __future__ import annotations

from typing import Any, Protocol


class Performable(Protocol):
    """Something an Actor can do — a Task or an Interaction."""

    def perform_as(self, actor: "Actor") -> None: ...


class Answerable(Protocol):
    """Something an Actor can ask about the state of the system — a Question."""

    def answered_by(self, actor: "Actor") -> Any: ...


class Actor:
    """An Actor performs Tasks/Interactions and asks Questions using their Abilities."""

    def __init__(self, name: str) -> None:
        self.name = name
        self._abilities: dict[type, Any] = {}
        self._notes: dict[str, Any] = {}

    @staticmethod
    def named(name: str) -> "Actor":
        return Actor(name)

    def who_can(self, *abilities: Any) -> "Actor":
        for ability in abilities:
            self._abilities[type(ability)] = ability
        return self

    def ability_to(self, ability_cls: type) -> Any:
        return self._abilities[ability_cls]

    def attempts_to(self, *activities: Performable) -> "Actor":
        for activity in activities:
            activity.perform_as(self)
        return self

    def asks_for(self, question: Answerable) -> Any:
        return question.answered_by(self)

    def remember(self, key: str, value: Any) -> "Actor":
        self._notes[key] = value
        return self

    def recall(self, key: str) -> Any:
        return self._notes[key]
