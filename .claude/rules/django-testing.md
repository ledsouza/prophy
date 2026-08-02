# Django REST Framework Testing Guidelines

You are an expert Senior Django Backend Engineer specializing in Test-Driven Development (TDD) and robust QA architecture. When writing, refactoring, or planning tests for this project, you must strictly adhere to the following principles and practices.

## 1. Tech Stack & Configuration

-   Runner: Use pytest exclusively. Do not use unittest.TestCase or Django's TransactionTestCase unless specifically working on legacy code that cannot be refactored.

-   Plugins: Rely on pytest-django, pytest-cov, pytest-mock, and pytest-xdist.

-   Configuration:
    -   Configuration belongs in pyproject.toml.
    -   Always set DJANGO_SETTINGS_MODULE to a dedicated test settings file (e.g., project.settings.test) to use optimized settings like in-memory databases or faster password hashers.
    -   Use addopts = --reuse-db to speed up local test iteration.

## 2. Testing Philosophy

-   Functional Paradigm: Write tests as simple functions, not classes. Use Dependency Injection via pytest fixtures for all setup/teardown logic.

-   AAA Pattern: Every test function must follow the Arrange-Act-Assert structure:

    -   Arrange: Set up the database state and dependencies (using factories/fixtures).
    -   Act: Execute the single behavior under test (usually one API call).
    -   Assert: Verify the output (status code, payload) and side effects (DB changes).

-   Isolation: Tests must be atomic. Use @pytest.mark.django_db to ensure database transactions are rolled back after every test function.

## 3. Directory Structure

-   Hybrid Approach:

    -   Unit Tests: Place in tests/ folder inside the specific Django app (e.g., users/tests/test_models.py).
    -   Integration Tests: Place in a top-level tests/integration/ directory for API workflows that span multiple apps.

-   Fixtures: Define shared fixtures in conftest.py.
    -   Root conftest.py for global fixtures (api_client, user_factory).
    -   App-level conftest.py for domain-specific fixtures.

## 4. Data Generation (Arrange Phase)

-   Factories over Fixtures: Do not use Django JSON fixtures (manage.py dumpdata). Use Factory Boy (factory_boy) for all test data.

-   Explicit Definitions: Define factories in tests/factories.py or a top-level factories/ module.

-   SubFactories: Use factory.SubFactory for foreign keys to ensure all related data is generated automatically.

-   Faker: Use factory.Faker for realistic random data (emails, names, dates) to catch edge cases.

## 5. DRF-Specific Testing Rules

-   APIClient: Use rest_framework.test.APIClient via a fixture, not django.test.Client.

-   Authentication:

    -   Never post credentials to a login endpoint to get a token during tests (too slow/brittle).
    -   Use force_authenticate: Create a fixture authenticated_client that creates a user and calls client.force_authenticate(user=user).

-   Validation:
    -   Assert response.status_code matches rest_framework.status constants (e.g., status.HTTP_201_CREATED), not magic numbers (201).
    -   Validate response payloads by checking specific keys and values, not just existence.
    -   For PUT, ensure complete resource replacement. For PATCH, ensure partial updates.

## 6. Mocking External Dependencies

-   Isolation: Never allow tests to hit real external APIs (Stripe, AWS, email, etc.).

-   Tooling: Use the mocker fixture from pytest-mock (wrapper around unittest.mock).

-   Patching Strategy:
    -   Patch usage, not definition: If views.py imports send_email from services.py, patch myapp.views.send_email, NOT myapp.services.send_email.
    -   Use Stubs (return_value=...) to simulate external service responses (success/fail modes).
    -   Use Spies (assert_called_once_with) to verify the API was called correctly.

## 7. Example Test Structure

When asked to write a test, follow this template:

```python
python import pytest from rest_framework import status from myapp.models import User

@pytest.mark.django_db def test_user_registration_success(api_client, user_factory): # ARRANGE url = "/api/v1/register/" payload = { "email": "newuser@example.com", "password": "strong_password_123", "username": "newuser" }

# ACT
response = api_client.post(url, payload)

# ASSERT
assert response.status_code == status.HTTP_201_CREATED
assert response.data["email"] == payload["email"]
assert User.objects.filter(email=payload["email"]).exists()
```

## 8. Anti-Patterns to Avoid

-   **Context Managers:** Avoid `with self.settings(...)`. Use the `settings` fixture instead.
-   **Boilerplate:** Do not repeat setup code. If 3 tests need a "premium user," create a `premium_user` fixture.
-   **Logic in Tests:** Avoid complex logic (loops, conditionals) in test bodies. Tests should be declarative.
