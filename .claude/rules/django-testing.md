---
paths:
  - "backend/**/tests/**"
  - "backend/conftest.py"
---

# Django REST Framework Testing Guidelines

## 1. Runner

- pytest only. No `unittest.TestCase` or `TransactionTestCase`.
- Plugins in use: pytest-django, pytest-cov, pytest-mock, pytest-xdist.
- `pyproject.toml` already sets `core.settings.test`, `--reuse-db` and coverage; do not add per-test settings overrides.

## 2. Philosophy

- Tests are plain functions. Setup and teardown come from pytest fixtures, never from class hierarchies.
- Every test follows Arrange-Act-Assert: set up state with factories or fixtures, perform one action (usually one API call), then assert status, payload and side effects.
- Mark database access with `@pytest.mark.django_db` so each test rolls back.

## 3. Layout

- Unit tests live in the app's own `tests/` folder (for example `users/tests/test_models.py`).
- Tests spanning several apps live in the top-level `backend/tests/`.
- Shared fixtures go in `conftest.py`: the root one for `api_client` and the role fixtures, app-level ones for domain-specific setup.

## 4. Data

- Use `factory_boy` factories from `backend/tests/factories/`. No Django JSON fixtures.
- `factory.SubFactory` for foreign keys, `factory.Faker` for realistic values.

## 5. DRF specifics

- Use `rest_framework.test.APIClient` from the `api_client` fixture, not `django.test.Client`.
- Never obtain a token by posting credentials. Call `api_client.force_authenticate(user=user)`.
- Assert `response.status_code` against `rest_framework.status` constants, never bare integers.
- Check specific keys and values in the payload, not only their presence.
- For PUT assert full replacement; for PATCH assert only the given fields changed.

## 6. External dependencies

- Never hit a real external service. Patch with the `mocker` fixture.
- Patch where the name is used, not where it is defined: `myapp.views.send_email`, not `myapp.services.send_email`.
- Stub with `return_value=...` to simulate responses; spy with `assert_called_once_with(...)` to verify calls.

## 7. Template

```python
import pytest
from rest_framework import status

from users.models import UserAccount


@pytest.mark.django_db
def test_user_registration_success(api_client, user_factory):
    # Arrange
    url = "/api/users/"
    payload = {
        "email": "newuser@example.com",
        "password": "strong_password_123",
        "cpf": "12345678909",
    }

    # Act
    response = api_client.post(url, payload)

    # Assert
    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["email"] == payload["email"]
    assert UserAccount.objects.filter(email=payload["email"]).exists()
```

## 8. Anti-patterns

- `with self.settings(...)`: use the `settings` fixture.
- Repeated setup across three or more tests: extract a fixture.
- Loops and conditionals inside a test body: tests are declarative.
