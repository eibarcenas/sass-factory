"""Targets for the seller onboarding stepper (apps/admin-fe BusinessFormPanel)."""

from __future__ import annotations

import re

from screenplay.target import Target

FILE_INPUT = Target.the("the image file input").located_by(
    lambda page: page.locator('input[type="file"]')
)

CROP_DIALOG_HEADING = Target.the("the crop dialog heading").located_by(
    lambda page: page.get_by_text("Encuadra tu imagen")
)

USE_IMAGE_BUTTON = Target.the("the 'Usar imagen' button").located_by(
    lambda page: page.get_by_role("button", name="Usar imagen")
)


def business_type_button(label: str) -> Target:
    return Target.the(f"the '{label}' business type button").located_by(
        lambda page: page.get_by_role("button", name=re.compile(label))
    )


BUSINESS_NAME_INPUT = Target.the("the business name input").located_by(
    lambda page: page.locator("#bfp-name")
)

CONTINUE_BUTTON = Target.the("the 'Continuar' button").located_by(
    lambda page: page.get_by_role("button", name="Continuar", exact=True)
)

CONTACT_NAME_INPUT = Target.the("the contact name input").located_by(
    lambda page: page.locator("#bfp-contact")
)

WHATSAPP_INPUT = Target.the("the WhatsApp number input").located_by(
    lambda page: page.locator("#bfp-whatsapp")
)

CITY_INPUT = Target.the("the city input").located_by(
    lambda page: page.locator("#bfp-city")
)

STATE_SELECT = Target.the("the state select").located_by(
    lambda page: page.locator("#bfp-state")
)

ADD_PRODUCT_BUTTON = Target.the("the 'Agregar producto' button").located_by(
    lambda page: page.get_by_role("button", name="Agregar producto", exact=True)
)

PRODUCT_NAME_INPUT = Target.the("the product name input").located_by(
    lambda page: page.get_by_placeholder("Product name")
)

PRODUCT_PRICE_INPUT = Target.the("the product price input").located_by(
    lambda page: page.get_by_placeholder("0")
)

PRODUCT_DESCRIPTION_INPUT = Target.the("the product description input").located_by(
    lambda page: page.get_by_placeholder("Descripción del producto")
)

SAVE_PRODUCT_BUTTON = Target.the("the 'Agregar' button").located_by(
    lambda page: page.get_by_role("button", name="Agregar", exact=True)
)

TERMS_CHECKBOX = Target.the("the terms checkbox").located_by(
    lambda page: page.get_by_role("checkbox")
)

SUBMIT_BUTTON = Target.the("the 'Crear tienda' button").located_by(
    lambda page: page.get_by_role("button", name="Crear tienda", exact=True)
)
