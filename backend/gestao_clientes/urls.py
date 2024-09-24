from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LatestPropostaStatusView, ClienteViewSet, UnidadeViewSet, EquipamentoViewSet

router = DefaultRouter()
router.register("clientes", ClienteViewSet, basename="clientes")
router.register("unidades", UnidadeViewSet, basename="unidades")
router.register("equipamentos", EquipamentoViewSet, basename="equipamentos")

urlpatterns = [
    path("propostas/status/",
         LatestPropostaStatusView.as_view()),
    path('', include(router.urls)),
]
