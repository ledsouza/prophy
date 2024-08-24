from django.urls import path
from .views import LatestClientStatusView

urlpatterns = [
    path("potenciais-clientes/status/", LatestClientStatusView.as_view()),
]
