from django.conf import settings
from django.contrib.auth import get_user_model

from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from django_filters.rest_framework import DjangoFilterBackend

from users.serializers import UnitManagerUserSerializer, CustomUserDeleteSerializer
from users.email import UnitManagerPasswordResetEmail
from users.models import UserAccount

from djoser.views import UserViewSet as DjoserUserViewSet
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

User = get_user_model()


class IsAdminOrClientManager(permissions.BasePermission):
    """
    Custom permission to allow both PROPHY_MANAGER and CLIENT_GENERAL_MANAGER users to delete users.
    """

    def has_permission(self, request, view):
        # Allow if user is staff (PROPHY_MANAGER) or has CLIENT_GENERAL_MANAGER role
        return (
            request.user.is_staff
            or request.user.role == UserAccount.Role.CLIENT_GENERAL_MANAGER
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Provides a custom endpoint to obtain JWT access and refresh tokens.

    Instead of sending tokens in the response body, this view sets them
    as HTTP-only cookies upon successful login.

    Attributes:
        None

    Methods:
        post(request, *args, **kwargs): Handles POST requests to obtain tokens.

    """

    @swagger_auto_schema(
        security=[{"Bearer": []}],
        responses={
            200: openapi.Response(
                description="Login successful",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "access": openapi.Schema(
                            type=openapi.TYPE_STRING, description="JWT access token"
                        ),
                        "refresh": openapi.Schema(
                            type=openapi.TYPE_STRING, description="JWT refresh token"
                        ),
                    },
                ),
            ),
            400: "Missing credentials: cpf and password are required",
            401: "Unauthorized",
        },
    )
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            access_token = response.data.get("access")
            refresh_token = response.data.get("refresh")

            response.set_cookie(
                "access",
                access_token,
                max_age=settings.AUTH_COOKIE_MAX_AGE,
                path=settings.AUTH_COOKIE_PATH,
                secure=settings.AUTH_COOKIE_SECURE,
                httponly=settings.AUTH_COOKIE_HTTP_ONLY,
                samesite=settings.AUTH_COOKIE_SAMESITE,
            )
            response.set_cookie(
                "refresh",
                refresh_token,
                max_age=settings.AUTH_COOKIE_MAX_AGE,
                path=settings.AUTH_COOKIE_PATH,
                secure=settings.AUTH_COOKIE_SECURE,
                httponly=settings.AUTH_COOKIE_HTTP_ONLY,
                samesite=settings.AUTH_COOKIE_SAMESITE,
            )

        return response


class CustomTokenRefreshView(TokenRefreshView):
    """
    Token refresh endpoint to refresh the JWT access token using the refresh token
    stored in the cookies.

    ## Behavior:

    - The refresh token is retrieved from the `refresh` cookie in the request.
    - On successful refresh, the new access token is set as a cookie.
    """

    @swagger_auto_schema(
        security=[{"Bearer": []}],
        responses={
            200: openapi.Response(
                description="Access token refreshed successfully",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "access": openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description="Refreshed JWT access token",
                        )
                    },
                ),
            ),
            400: "Missing credentials: refresh token is required",
            401: "Unauthorized",
        },
    )
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh")

        if refresh_token:
            request.data["refresh"] = refresh_token

        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            access_token = response.data.get("access")

            response.set_cookie(
                "access",
                access_token,
                max_age=settings.AUTH_COOKIE_MAX_AGE,
                path=settings.AUTH_COOKIE_PATH,
                secure=settings.AUTH_COOKIE_SECURE,
                httponly=settings.AUTH_COOKIE_HTTP_ONLY,
                samesite=settings.AUTH_COOKIE_SAMESITE,
            )

        return response


class CustomTokenVerifyView(TokenVerifyView):
    """
    Token verify endpoint to verify the validity of the access token
    stored in the cookies.

    ## Behavior:

    - The access token is retrieved from the `access` cookie in the request.
    - The token is then verified.
    """

    @swagger_auto_schema(
        security=[{"Bearer": []}],
        responses={
            200: openapi.Response(
                description="Token verification successful",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "valid": openapi.Schema(
                            type=openapi.TYPE_BOOLEAN,
                            description="Indicates if the token is valid",
                        ),
                    },
                ),
            ),
            401: "Unauthorized",
        },
    )
    def post(self, request, *args, **kwargs):
        access_token = request.COOKIES.get("access")

        if access_token:
            request.data["token"] = access_token

        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            return Response({"valid": True}, status=status.HTTP_200_OK)

        return response


class LogoutView(APIView):
    """
    Logout view to clear the JWT access and refresh tokens stored in the cookies.

    ## Behavior:

    - Clears the `access` and `refresh` cookies upon logout.
    """

    @swagger_auto_schema(
        responses={
            204: openapi.Response(
                description="Logout successful",
            )
        }
    )
    def post(self, request, *args, **kwargs):
        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie("access")
        response.delete_cookie("refresh")

        return response


class ExtendedUserViewSet(DjoserUserViewSet):
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['cpf']

    def get_permissions(self):
        permissions = super().get_permissions()
        if self.action == "destroy":
            return [IsAdminOrClientManager()]
        return permissions

    def get_serializer_class(self):
        if self.action == "destroy":
            return CustomUserDeleteSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        user: UserAccount = self.request.user

        if self.action == "list":
            if user.role == UserAccount.Role.CLIENT_GENERAL_MANAGER:
                return UserAccount.objects.filter(role=UserAccount.Role.UNIT_MANAGER)
            elif user.is_staff or user.role == UserAccount.Role.PROPHY_MANAGER:
                return UserAccount.objects.all()
            else:
                return UserAccount.objects.filter(id=user.id)

        return super().get_queryset()

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["cpf", "email", "name", "phone", "unit_id"],
            properties={
                "cpf": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="CPF of the unit manager",
                ),
                "email": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Email address of the unit manager",
                ),
                "name": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Full name of the unit manager",
                ),
                "phone": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Phone number of the unit manager",
                ),
                "unit_id": openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="ID of the unit that the manager will be associated with",
                ),
            },
        ),
        responses={
            201: openapi.Response(
                description="User created",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "detail": openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description="Details about the response",
                        ),
                        "email": openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description="E-mail of the created user",
                        ),
                        "user_id": openapi.Schema(
                            type=openapi.TYPE_NUMBER,
                            description="ID of the created user",
                        ),
                    },
                ),
            ),
            400: "Bad request: validation error",
            403: "Forbidden: only Client Managers or Prophy Managers can create Unit Managers",
        },
    )
    @action(["post"], detail=False, url_path="create-unit-manager")
    def create_unit_manager(self, request, *args, **kwargs):
        """
        Endpoint for creating a Unit Manager user.

        This endpoint allows only users with the roles Client Manager or Prophy Manager
        to create a new Unit Manager user. A password reset email is sent to the newly created
        user's email address upon successful creation.

        Args:
            request: The HTTP request object, containing user data and required fields
                    'cpf', 'email', 'name', 'phone', and 'unit_id'.

        Returns:
            Response: A JSON response with a success message and the new user's email if creation
                    is successful. If the user is created but the email fails to send, returns a
                    partial success message.

        Raises:
            HTTP_403_FORBIDDEN: If the request user does not have permission to create a Unit Manager.
            ValidationError: If the unit with the given ID does not exist.
        """
        if (
            request.user.role != UserAccount.Role.CLIENT_GENERAL_MANAGER
            and request.user.role != UserAccount.Role.PROPHY_MANAGER
        ):
            return Response(
                {
                    "detail": "Only Client Managers or Prophy Managers can create Unit Managers users"
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = UnitManagerUserSerializer(
            data={
                "cpf": request.data.get("cpf"),
                "email": request.data.get("email"),
                "name": request.data.get("name"),
                "phone": request.data.get("phone"),
                "unit_id": request.data.get("unit_id"),
            }
        )
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        if user:
            context = {"user": user}
            to = [user.email]
            UnitManagerPasswordResetEmail(
                self.request,
                context,
                template_name="email/unit-manager-password-reset.html",
            ).send(to)

            return Response(
                {
                    "detail": "Unit manager user created. Password reset email sent.",
                    "email": user.email,
                    "user_id": user.id,
                },
                status=status.HTTP_201_CREATED,
            )

        # If something goes wrong with sending reset email
        return Response(
            {
                "detail": "User created but could not send password reset email",
                "email": user.email,
                "user_id": user.id,
            },
            status=status.HTTP_206_PARTIAL_CONTENT,
        )
