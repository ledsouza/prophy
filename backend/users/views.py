from django.conf import settings
from django.contrib.auth import get_user_model

from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)

from users.serializers import UnitManagerUserSerializer
from users.email import UnitManagerPasswordResetEmail

from djoser.views import UserViewSet as DjoserUserViewSet
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

User = get_user_model()


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
        security=[{'Bearer': []}],
        responses={
            200: openapi.Response(
                description="Login successful",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'access': openapi.Schema(type=openapi.TYPE_STRING, description="JWT access token"),
                        'refresh': openapi.Schema(type=openapi.TYPE_STRING, description="JWT refresh token")
                    }
                )
            ),
            400: "Missing credentials: cpf and password are required",
            401: "Unauthorized"
        }
    )
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')

            response.set_cookie(
                'access',
                access_token,
                max_age=settings.AUTH_COOKIE_MAX_AGE,
                path=settings.AUTH_COOKIE_PATH,
                secure=settings.AUTH_COOKIE_SECURE,
                httponly=settings.AUTH_COOKIE_HTTP_ONLY,
                samesite=settings.AUTH_COOKIE_SAMESITE
            )
            response.set_cookie(
                'refresh',
                refresh_token,
                max_age=settings.AUTH_COOKIE_MAX_AGE,
                path=settings.AUTH_COOKIE_PATH,
                secure=settings.AUTH_COOKIE_SECURE,
                httponly=settings.AUTH_COOKIE_HTTP_ONLY,
                samesite=settings.AUTH_COOKIE_SAMESITE
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
        security=[{'Bearer': []}],
        responses={
            200: openapi.Response(
                description="Access token refreshed successfully",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'access': openapi.Schema(type=openapi.TYPE_STRING, description="Refreshed JWT access token")
                    }
                )
            ),
            400: "Missing credentials: refresh token is required",
            401: "Unauthorized"
        }
    )
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh')

        if refresh_token:
            request.data['refresh'] = refresh_token

        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            access_token = response.data.get('access')

            response.set_cookie(
                'access',
                access_token,
                max_age=settings.AUTH_COOKIE_MAX_AGE,
                path=settings.AUTH_COOKIE_PATH,
                secure=settings.AUTH_COOKIE_SECURE,
                httponly=settings.AUTH_COOKIE_HTTP_ONLY,
                samesite=settings.AUTH_COOKIE_SAMESITE
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
        security=[{'Bearer': []}],
        responses={
            200: openapi.Response(
                description="Token verification successful",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "valid": openapi.Schema(
                            type=openapi.TYPE_BOOLEAN,
                            description="Indicates if the token is valid"
                        ),
                    }
                )
            ),
            401: "Unauthorized"
        }
    )
    def post(self, request, *args, **kwargs):
        access_token = request.COOKIES.get('access')

        if access_token:
            request.data['token'] = access_token

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
        response.delete_cookie('access')
        response.delete_cookie('refresh')

        return response


class CustomUserViewSet(DjoserUserViewSet):
    @action(["post"], detail=False, url_path="create-unit-manager")
    def create_unit_manager(self, request, *args, **kwargs):
        """
        Custom endpoint for creating a 'Gerente de Unidade' (Unit Manager) user.

        This endpoint allows only users with the roles 'Gerente Geral do Cliente' or 'Gerente Prophy' 
        to create a new 'Gerente de Unidade' user. A password reset email is sent to the newly created 
        user's email address upon successful creation.

        Args:
            request: The HTTP request object, containing user data and required fields 'cpf', 'email', and 'name'.

        Returns:
            Response: A JSON response with a success message and the new user's email if creation 
                    is successful. If the user is created but the email fails to send, returns a 
                    partial success message.

        Raises:
            HTTP_403_FORBIDDEN: If the request user does not have permission to create a 'Gerente de Unidade'.
        """
        # Ensure only Gerente Geral do Cliente and Gerente Prophy can create this user
        if (request.user.role != "Gerente Geral do Cliente" or
                    request.user.role != "Gerente Prophy"
                ):
            return Response(
                {"detail": "Only Gerente Geral do Cliente or Gerente Prophy can create Gerente de Unidade users"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Validate input data
        serializer = UnitManagerUserSerializer(data={
            "cpf": request.data.get("cpf"),
            "email": request.data.get("email"),
            "name": request.data.get("name"),
        })
        serializer.is_valid(raise_exception=True)

        # Create the user
        user = serializer.save()

        if user:
            context = {"user": user}
            to = [user.email]
            UnitManagerPasswordResetEmail(
                self.request, context, template_name="email/unit-manager-password-reset.html").send(to)

            return Response({
                "detail": "Unit manager user created. Password reset email sent.",
                "email": user.email
            }, status=status.HTTP_201_CREATED)

        # If something goes wrong with sending reset email
        return Response({
            "detail": "User created but could not send password reset email",
            "email": user.email
        }, status=status.HTTP_206_PARTIAL_CONTENT)
