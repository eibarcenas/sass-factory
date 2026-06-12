"""High-level Tasks for the seller self-registration / onboarding stepper."""

from __future__ import annotations

from pages import onboarding_page as page
from screenplay.actor import Actor
from screenplay.interactions.common import (
    Check,
    Click,
    Enter,
    Navigate,
    SelectOption,
    SetInputFiles,
    WaitForJsCondition,
    WaitForResponse,
    WaitUntilEnabled,
    WaitUntilHasClass,
    WaitUntilVisible,
)

IMAGE_LOADED_JS = (
    "() => { const img = document.querySelector('img[alt=\"\"]'); "
    "return !!img && img.complete && img.naturalWidth > 0; }"
)


class OpenTheOnboardingPage:
    """Navigate a new seller to the onboarding stepper."""

    @staticmethod
    def for_a_new_seller() -> Navigate:
        return Navigate.to("/es/onboarding/business")


class AttachAndCropImage:
    """Pick a file, confirm the crop dialog, and wait for the upload to complete."""

    def __init__(self, image_path: str) -> None:
        self._image_path = image_path

    @staticmethod
    def from_file(image_path: str) -> "AttachAndCropImage":
        return AttachAndCropImage(image_path)

    def perform_as(self, actor: Actor) -> None:
        actor.attempts_to(
            SetInputFiles.at_path(self._image_path).into(page.FILE_INPUT),
            WaitUntilVisible.the(page.CROP_DIALOG_HEADING),
            WaitForJsCondition.to_be_true(IMAGE_LOADED_JS),
            WaitForResponse.matching("/business-registration-images").while_performing(
                Click.on(page.USE_IMAGE_BUTTON)
            ),
        )


class CompleteTheBusinessStep:
    """Step 1: logo, business type, and business name."""

    def __init__(self, business_name: str, business_type_label: str, logo_path: str) -> None:
        self._business_name = business_name
        self._business_type_label = business_type_label
        self._logo_path = logo_path

    @staticmethod
    def naming_it(business_name: str, business_type_label: str, logo_path: str) -> "CompleteTheBusinessStep":
        return CompleteTheBusinessStep(business_name, business_type_label, logo_path)

    def perform_as(self, actor: Actor) -> None:
        actor.attempts_to(
            AttachAndCropImage.from_file(self._logo_path),
            Click.on(page.business_type_button(self._business_type_label)),
            Enter.the_text(self._business_name).into(page.BUSINESS_NAME_INPUT),
            WaitUntilHasClass.matching(r"border-green-500", timeout=10_000).on(page.BUSINESS_NAME_INPUT),
            Click.on(page.CONTINUE_BUTTON),
        )


class CompleteTheContactStep:
    """Step 2: contact name, WhatsApp number, city, and state."""

    def __init__(self, contact_name: str, whatsapp: str, city: str, state: str) -> None:
        self._contact_name = contact_name
        self._whatsapp = whatsapp
        self._city = city
        self._state = state

    @staticmethod
    def with_details(contact_name: str, whatsapp: str, city: str, state: str) -> "CompleteTheContactStep":
        return CompleteTheContactStep(contact_name, whatsapp, city, state)

    def perform_as(self, actor: Actor) -> None:
        actor.attempts_to(
            Enter.the_text(self._contact_name).into(page.CONTACT_NAME_INPUT),
            Enter.the_text(self._whatsapp).into(page.WHATSAPP_INPUT),
            Enter.the_text(self._city).into(page.CITY_INPUT),
            SelectOption.labelled(self._state).from_(page.STATE_SELECT),
            Click.on(page.CONTINUE_BUTTON),
        )


class AddAProduct:
    """Step 3: add a single draft product with name, price, description, and image."""

    def __init__(self, name: str, price: str, description: str, image_path: str) -> None:
        self._name = name
        self._price = price
        self._description = description
        self._image_path = image_path

    @staticmethod
    def named(name: str, price: str, description: str, image_path: str) -> "AddAProduct":
        return AddAProduct(name, price, description, image_path)

    def perform_as(self, actor: Actor) -> None:
        actor.attempts_to(
            Click.on(page.ADD_PRODUCT_BUTTON),
            Enter.the_text(self._name).into(page.PRODUCT_NAME_INPUT),
            Enter.the_text(self._price).into(page.PRODUCT_PRICE_INPUT),
            Enter.the_text(self._description).into(page.PRODUCT_DESCRIPTION_INPUT),
            AttachAndCropImage.from_file(self._image_path),
            Click.on(page.SAVE_PRODUCT_BUTTON),
            WaitUntilEnabled.the(page.CONTINUE_BUTTON),
            Click.on(page.CONTINUE_BUTTON),
        )


class AcceptTermsAndSubmitRegistration:
    """Step 4: accept the terms and submit the registration."""

    @staticmethod
    def now() -> "AcceptTermsAndSubmitRegistration":
        return AcceptTermsAndSubmitRegistration()

    def perform_as(self, actor: Actor) -> None:
        actor.attempts_to(
            Check.the(page.TERMS_CHECKBOX),
            WaitUntilEnabled.the(page.SUBMIT_BUTTON, timeout=15_000),
            WaitForResponse.matching("/api/v1/business-registrations", method="POST")
            .and_remember_as("registration_response")
            .while_performing(Click.on(page.SUBMIT_BUTTON)),
        )
