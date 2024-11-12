from django.urls import path, include
from rest_framework.routers import DefaultRouter
from clients_management.views import LatestProposalStatusView, ClientViewSet, UnitViewSet, EquipmentViewSet

router = DefaultRouter()
router.register("clients", ClientViewSet, basename="clients")
router.register("units", UnitViewSet, basename="units")
router.register("equipments", EquipmentViewSet, basename="equipments")

urlpatterns = [
    path("proposals/status/",
         LatestProposalStatusView.as_view()),
    path('', include(router.urls)),
]
