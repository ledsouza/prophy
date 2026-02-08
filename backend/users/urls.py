from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .associations import (
    ClientUserAssociationView,
    UnitManagerAssociationView,
    UserAssociationsSummaryView,
)
from .management import UserManagementViewSet
from .views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    CustomTokenVerifyView,
    ExtendedUserViewSet,
    LogoutView,
)

router = DefaultRouter()
router.register("users", ExtendedUserViewSet, basename="user")

manage_router = DefaultRouter()
manage_router.register("", UserManagementViewSet, basename="user-management")

urlpatterns = [
    path("jwt/create/", CustomTokenObtainPairView.as_view()),
    path("jwt/refresh/", CustomTokenRefreshView.as_view()),
    path("jwt/verify/", CustomTokenVerifyView.as_view()),
    path("logout/", LogoutView.as_view()),
    path(
        "clients/<int:client_id>/users/",
        ClientUserAssociationView.as_view(),
    ),
    path(
        "clients/<int:client_id>/users/<int:user_id>/",
        ClientUserAssociationView.as_view(),
    ),
    path(
        "units/<int:unit_id>/unit-manager/",
        UnitManagerAssociationView.as_view(),
    ),
    path(
        "users/manage/<int:user_id>/associations/",
        UserAssociationsSummaryView.as_view(),
    ),
    path("users/manage/", include(manage_router.urls)),
    path("", include(router.urls)),
]
