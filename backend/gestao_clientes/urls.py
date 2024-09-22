from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LatestPropostaStatusView, ClienteViewSet

router = DefaultRouter()
router.register("clientes", ClienteViewSet, basename="clientes")

urlpatterns = [
    path("propostas/status/",
         LatestPropostaStatusView.as_view()),
    path('', include(router.urls)),
]
