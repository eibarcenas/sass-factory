from __future__ import annotations

import time
from pathlib import Path

from behave import given, then, when

from pages import onboarding_page as page
from screenplay.interactions.common import WaitForJsCondition
from screenplay.questions.common import CurrentUrl, ResponseStatus
from screenplay.tasks.onboarding import (
    AcceptTermsAndSubmitRegistration,
    AddAProduct,
    CompleteTheBusinessStep,
    CompleteTheContactStep,
    OpenTheOnboardingPage,
)

FIXTURES = Path(__file__).resolve().parents[2] / "fixtures"
TEST_IMAGE = str(FIXTURES / "test-image.jpg")

REDIRECTED_TO_SELLER_PRODUCTS_JS = "() => window.location.pathname.includes('/seller/products')"


@given("Ana is signed in as a new seller")
def step_signed_in(context):
    assert context.actor is not None


@when("Ana opens the onboarding page")
def step_open_onboarding(context):
    context.actor.attempts_to(OpenTheOnboardingPage.for_a_new_seller())


@when('Ana completes the business step with type "{business_type}" and her logo')
def step_business_step(context, business_type):
    business_name = f"QA{int(time.time())}"
    context.business_name = business_name
    context.actor.attempts_to(
        CompleteTheBusinessStep.naming_it(business_name, business_type, TEST_IMAGE)
    )


@when(
    'Ana completes the contact step with contact "{contact_name}", '
    'whatsapp "{whatsapp}", city "{city}" and state "{state}"'
)
def step_contact_step(context, contact_name, whatsapp, city, state):
    context.actor.attempts_to(
        CompleteTheContactStep.with_details(contact_name, whatsapp, city, state)
    )


@when('Ana adds a product named "{name}" priced at "{price}" described as "{description}"')
def step_add_product(context, name, price, description):
    context.actor.attempts_to(AddAProduct.named(name, price, description, TEST_IMAGE))


@when("Ana accepts the terms and submits the registration")
def step_submit_registration(context):
    context.actor.attempts_to(AcceptTermsAndSubmitRegistration.now())


@then("the registration request should succeed")
def step_registration_succeeded(context):
    status = context.actor.asks_for(ResponseStatus.of("registration_response"))
    assert status == 200, f"Expected registration response status 200, got {status}"


@then("Ana should be redirected to the seller products page")
def step_redirected_to_seller_products(context):
    context.actor.attempts_to(
        WaitForJsCondition.to_be_true(REDIRECTED_TO_SELLER_PRODUCTS_JS, timeout=15_000)
    )
    url = context.actor.asks_for(CurrentUrl.value())
    assert "/seller/products" in url, f"Expected redirect to /seller/products, got {url}"
