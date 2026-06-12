Feature: Seller self-registration onboarding stepper

  As a new seller whose account has just been created (role UNASSIGNED),
  I want to complete the 4-step onboarding stepper,
  so that my business is registered and I become a store OWNER.

  Scenario: Ana completes the 4-step onboarding stepper and registers her business
    Given Ana is signed in as a new seller
    When Ana opens the onboarding page
    And Ana completes the business step with type "Heladería" and her logo
    And Ana completes the contact step with contact "QA Tester", whatsapp "+52 55 1234 5678", city "Monterrey" and state "Nuevo León"
    And Ana adds a product named "Producto QA" priced at "99" described as "Producto de prueba QA"
    And Ana accepts the terms and submits the registration
    Then the registration request should succeed
    And Ana should be redirected to the seller products page
