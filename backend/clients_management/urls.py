from django.urls import path, include
from rest_framework.routers import DefaultRouter
from clients_management.views import (
    LatestProposalStatusView,
    ClientStatusView,
    ClientViewSet,
    UnitViewSet,
    EquipmentViewSet,
    ModalityViewSet
)

router = DefaultRouter()
router.register("clients", ClientViewSet, basename="clients")
router.register("units", UnitViewSet, basename="units")
router.register("equipments", EquipmentViewSet, basename="equipments")
router.register("modalities", ModalityViewSet, basename="modality")

urlpatterns = [
    path("proposals/status/",
         LatestProposalStatusView.as_view()),
    path("clients/status/", ClientStatusView.as_view()),
    path("", include(router.urls)),
]
