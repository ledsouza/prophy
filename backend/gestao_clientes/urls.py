from django.urls import path
from .views import LatestPropostaStatusView, CreateClienteView

urlpatterns = [
    path("propostas/status/",
         LatestPropostaStatusView.as_view()),
    path("clientes/", CreateClienteView.as_view()),
]
