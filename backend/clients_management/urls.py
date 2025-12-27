from django.urls import include, path
from rest_framework.routers import DefaultRouter

from clients_management.views import (
    AccessoryViewSet,
    AppointmentViewSet,
    ClientStatusView,
    ClientViewSet,
    EquipmentViewSet,
    LatestProposalStatusView,
    ModalityViewSet,
    ProposalViewSet,
    ReportFileDownloadView,
    ReportViewSet,
    ServiceOrderPDFView,
    ServiceOrderViewSet,
    TriggerContractNotificationsView,
    TriggerReportNotificationView,
    TriggerUpdateAppointmentsView,
    UnitViewSet,
    ProposalFileDownloadView,
)

router = DefaultRouter()
router.register("clients", ClientViewSet, basename="clients")
router.register("units", UnitViewSet, basename="units")
router.register("equipments", EquipmentViewSet, basename="equipments")
router.register("appointments", AppointmentViewSet, basename="appointments")
router.register("modalities", ModalityViewSet, basename="modality")
router.register("accessories", AccessoryViewSet, basename="accessory")
router.register("proposals", ProposalViewSet, basename="proposals")
router.register("service-orders", ServiceOrderViewSet, basename="service-orders")
router.register("reports", ReportViewSet, basename="reports")

urlpatterns = [
    path("proposals/status/", LatestProposalStatusView.as_view()),
    path("clients/status/", ClientStatusView.as_view()),
    path("service-orders/<int:order_id>/pdf/", ServiceOrderPDFView.as_view()),
    path(
        "reports/<int:report_id>/download/",
        ReportFileDownloadView.as_view(),
        name="report-file-download",
    ),
    path(
        "proposals/<int:proposal_id>/download/<str:file_type>/",
        ProposalFileDownloadView.as_view(),
    ),
    path(
        "reports/tasks/run-report-notifications/",
        TriggerReportNotificationView.as_view(),
        name="trigger_report_notifications",
    ),
    path(
        "appointments/tasks/update-overdue/",
        TriggerUpdateAppointmentsView.as_view(),
        name="trigger_update_appointments",
    ),
    path(
        "proposals/tasks/run-contract-notifications/",
        TriggerContractNotificationsView.as_view(),
        name="trigger_contract_notifications",
    ),
    path("", include(router.urls)),
]
