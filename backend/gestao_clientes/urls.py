from django.urls import path
from .views import LatestPotencialClienteStatusView, CreateClienteView

urlpatterns = [
    path("potenciais-clientes/status/",
         LatestPotencialClienteStatusView.as_view()),
    path("clientes/", CreateClienteView.as_view()),
]
