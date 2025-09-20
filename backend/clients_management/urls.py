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
    ServiceOrderViewSet,
    TriggerReportNotificationView,
    TriggerUpdateVisitsView,
    UnitViewSet,
    VisitViewSet,
)

router = DefaultRouter()
router.register("clients", ClientViewSet, basename="clients")
router.register("units", UnitViewSet, basename="units")
router.register("equipments", EquipmentViewSet, basename="equipments")
router.register("visits", VisitViewSet, basename="visits")
router.register("modalities", ModalityViewSet, basename="modality")
router.register("accessories", AccessoryViewSet, basename="accessory")
router.register("proposals", ProposalViewSet, basename="proposals")
router.register("service-orders", ServiceOrderViewSet, basename="service-orders")

urlpatterns = [
    path("proposals/status/", LatestProposalStatusView.as_view()),
    path("clients/status/", ClientStatusView.as_view()),
    path("service-orders/<int:order_id>/pdf/", ServiceOrderPDFView.as_view()),
    path(
        "reports/tasks/run-report-notifications/",
        TriggerReportNotificationView.as_view(),
        name="trigger_report_notifications",
    ),
    path(
        "visits/tasks/update-overdue/",
        TriggerUpdateVisitsView.as_view(),
        name="trigger_update_visits",
    ),
    path("", include(router.urls)),
]
