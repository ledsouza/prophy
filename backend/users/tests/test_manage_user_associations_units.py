import pytest
from rest_framework import status
from rest_framework.test import APIClient
from tests.factories.clients_management import UnitFactory
from tests.factories.users import UserFactory

from users.models import UserAccount


@pytest.mark.django_db
def test_gp_can_assign_gu_to_unit():
    api_client = APIClient()
    gp = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    gu_user = UserFactory(role=UserAccount.Role.UNIT_MANAGER)
    unit = UnitFactory()

    api_client.force_authenticate(user=gp)
    response = api_client.put(
        f"/api/units/{unit.id}/unit-manager/",
        {"user_id": gu_user.id},
        format="json",
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT
    unit.refresh_from_db()
    assert unit.user_id == gu_user.id


@pytest.mark.django_db
def test_gp_cannot_assign_non_gu_to_unit():
    api_client = APIClient()
    gp = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    user = UserFactory(role=UserAccount.Role.CLIENT_GENERAL_MANAGER)
    unit = UnitFactory()

    api_client.force_authenticate(user=gp)
    response = api_client.put(
        f"/api/units/{unit.id}/unit-manager/",
        {"user_id": user.id},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    unit.refresh_from_db()
    assert unit.user_id is None


@pytest.mark.django_db
def test_gp_can_unassign_unit_manager():
    api_client = APIClient()
    gp = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    gu_user = UserFactory(role=UserAccount.Role.UNIT_MANAGER)
    unit = UnitFactory(user=gu_user)

    api_client.force_authenticate(user=gp)
    response = api_client.put(
        f"/api/units/{unit.id}/unit-manager/",
        {"user_id": None},
        format="json",
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT
    unit.refresh_from_db()
    assert unit.user_id is None


@pytest.mark.django_db
def test_gp_cannot_override_existing_unit_manager():
    api_client = APIClient()
    gp = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    current_manager = UserFactory(role=UserAccount.Role.UNIT_MANAGER)
    next_manager = UserFactory(role=UserAccount.Role.UNIT_MANAGER)
    unit = UnitFactory(user=current_manager)

    api_client.force_authenticate(user=gp)
    response = api_client.put(
        f"/api/units/{unit.id}/unit-manager/",
        {"user_id": next_manager.id},
        format="json",
    )

    assert response.status_code == status.HTTP_409_CONFLICT
    assert response.data["current_unit_manager"]["id"] == current_manager.id
    assert response.data["current_unit_manager"]["name"] == current_manager.name
    unit.refresh_from_db()
    assert unit.user_id == current_manager.id


@pytest.mark.django_db
def test_commercial_can_assign_gu_to_unit():
    api_client = APIClient()
    commercial = UserFactory(role=UserAccount.Role.COMMERCIAL)
    gu_user = UserFactory(role=UserAccount.Role.UNIT_MANAGER)
    unit = UnitFactory()

    api_client.force_authenticate(user=commercial)
    response = api_client.put(
        f"/api/units/{unit.id}/unit-manager/",
        {"user_id": gu_user.id},
        format="json",
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT
    unit.refresh_from_db()
    assert unit.user_id == gu_user.id


@pytest.mark.django_db
def test_commercial_cannot_assign_non_gu_to_unit():
    api_client = APIClient()
    commercial = UserFactory(role=UserAccount.Role.COMMERCIAL)
    user = UserFactory(role=UserAccount.Role.CLIENT_GENERAL_MANAGER)
    unit = UnitFactory()

    api_client.force_authenticate(user=commercial)
    response = api_client.put(
        f"/api/units/{unit.id}/unit-manager/",
        {"user_id": user.id},
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    unit.refresh_from_db()
    assert unit.user_id is None
