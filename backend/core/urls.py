from django.contrib import admin
from django.urls import path, include
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="Prophy Medical Physics Management System API",
        default_version='v1',
        description="API documentation for Prophy's comprehensive medical physics management system.",
        terms_of_service="https://www.prophy.med.com/terms/",  # Placeholder
        contact=openapi.Contact(
            email="leandro.souza.159@gmail.com"),  # Placeholder
        license=openapi.License(name="GPL-3.0 License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("users.urls")),
    path("api/", include("clients_management.urls")),
    path("api/", include("requisitions.urls")),
    path('api/docs/', schema_view.with_ui('swagger',
         cache_timeout=0), name='schema-swagger-ui'),
]
