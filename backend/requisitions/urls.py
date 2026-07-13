from django.urls import include, path
from rest_framework.routers import DefaultRouter

from requisitions.views import (
    ClientOperationViewSet,
    EquipmentOperationViewSet,
    UnitOperationViewSet,
)

router = DefaultRouter()
router.register(
    "clients/operations", ClientOperationViewSet, basename="clients-operations"
)
router.register(
    "units/operations", UnitOperationViewSet, basename="units-operations"
)
router.register(
    "equipments/operations",
    EquipmentOperationViewSet,
    basename="equipments-operations",
)

urlpatterns = [
    path("", include(router.urls)),
]
