from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InstitutionalMaterialViewSet,
    InstitutionalMaterialDownloadView,
)

router = DefaultRouter()
router.register(r"", InstitutionalMaterialViewSet, basename="materials")

urlpatterns = [
    path("materials/", include(router.urls)),
    path(
        "materials/<int:material_id>/download/",
        InstitutionalMaterialDownloadView.as_view(),
        name="material-download",
    ),
]
