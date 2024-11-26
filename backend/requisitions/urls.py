from django.urls import path, include
from rest_framework.routers import DefaultRouter
from requisitions.views import ClientOperationViewSet

router = DefaultRouter()
router.register("client-operations", ClientOperationViewSet,
                basename="client-operations")

urlpatterns = [
    path('', include(router.urls)),
]
