import pytest
from pydantic import ValidationError

from app.routers.auth import BusinessRegistrationRequest


def valid_registration():
    return {
        "businessName": "Cocina Norte",
        "type": "restaurante",
        "whatsapp": "+525512345678",
        "city": "Monterrey",
        "state": "Nuevo León",
        "contactName": "Ana Pérez",
        "logo": "https://example.com/logo.jpg",
        "acceptedTerms": True,
        "products": [{
            "name": "Tacos",
            "price": 95,
            "description": "Orden de tres tacos",
            "images": ["https://example.com/tacos.jpg"],
        }],
    }


def test_complete_registration_is_valid():
    registration = BusinessRegistrationRequest.model_validate(valid_registration())

    assert registration.businessName == "Cocina Norte"
    assert registration.acceptedTerms is True
    assert len(registration.products) == 1


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("logo", ""),
        ("contactName", ""),
        ("whatsapp", ""),
        ("city", ""),
        ("state", ""),
        ("acceptedTerms", False),
        ("products", []),
    ],
)
def test_registration_rejects_missing_required_information(field, value):
    payload = valid_registration()
    payload[field] = value

    with pytest.raises(ValidationError):
        BusinessRegistrationRequest.model_validate(payload)


@pytest.mark.parametrize(
    "product_patch",
    [
        {"description": ""},
        {"price": 0},
        {"images": []},
    ],
)
def test_registration_rejects_incomplete_products(product_patch):
    payload = valid_registration()
    payload["products"][0].update(product_patch)

    with pytest.raises(ValidationError):
        BusinessRegistrationRequest.model_validate(payload)
