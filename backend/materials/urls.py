from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    InstitutionalMaterialDownloadView,
    InstitutionalMaterialViewSet,
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
