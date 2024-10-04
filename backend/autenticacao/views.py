from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


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
