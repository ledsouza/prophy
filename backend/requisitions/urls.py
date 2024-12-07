from django.urls import path, include
from rest_framework.routers import DefaultRouter
from requisitions.views import ClientOperationViewSet, UnitOperationViewSet

router = DefaultRouter()
router.register("client-operations", ClientOperationViewSet,
                basename="client-operations")
router.register("unit-operations", UnitOperationViewSet,
                basename="unit-operations")

urlpatterns = [
    path('', include(router.urls)),
]
