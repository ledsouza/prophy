import pytest
from rest_framework import status

from tests.factories import AccessoryFactory


@pytest.mark.django_db
def test_list_accessories_returns_alphabetical_by_model(
    api_client, prophy_manager
):
    AccessoryFactory(model="Zebra Detector")
    AccessoryFactory(model="Alpha Coil")
    AccessoryFactory(model="Mid Transducer")
    api_client.force_authenticate(user=prophy_manager)

    response = api_client.get("/api/accessories/")

    assert response.status_code == status.HTTP_200_OK
    assert [item["model"] for item in response.data] == [
        "Alpha Coil",
        "Mid Transducer",
        "Zebra Detector",
    ]
