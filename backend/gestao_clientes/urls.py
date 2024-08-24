from django.urls import path
from .views import LatestPotencialClienteStatusView

urlpatterns = [
    path("potenciais-clientes/status/",
         LatestPotencialClienteStatusView.as_view()),
]
