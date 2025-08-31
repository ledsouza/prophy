from django.urls import include, path
from rest_framework.routers import DefaultRouter

from clients_management.views import (
    AccessoryViewSet,
    ClientStatusView,
    ClientViewSet,
    EquipmentViewSet,
    LatestProposalStatusView,
    ModalityViewSet,
    ProposalViewSet,
    ServiceOrderPDFView,
    UnitViewSet,
    VisitViewSet,
    trigger_report_notification_task,
)

router = DefaultRouter()
router.register("clients", ClientViewSet, basename="clients")
router.register("units", UnitViewSet, basename="units")
router.register("equipments", EquipmentViewSet, basename="equipments")
router.register("visits", VisitViewSet, basename="visits")
router.register("modalities", ModalityViewSet, basename="modality")
router.register("accessories", AccessoryViewSet, basename="accessory")
router.register("proposals", ProposalViewSet, basename="proposals")

urlpatterns = [
    path("proposals/status/", LatestProposalStatusView.as_view()),
    path("clients/status/", ClientStatusView.as_view()),
    path("service-orders/<int:order_id>/pdf/", ServiceOrderPDFView.as_view()),
    path("", include(router.urls)),
    path(
        "tasks/notifications/run-report-notifications/",
        trigger_report_notification_task,
    ),
]
