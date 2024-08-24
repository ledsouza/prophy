from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("autenticacao.urls")),
    path("api/", include("djoser.urls")),
    path("api/", include("gestao_clientes.urls")),
]
