import jwt
from django.conf import settings
from django.http import HttpRequest
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2 import id_token
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError
from validate_docbr import CPF

from users.models import UserAccount


def generate_unique_service_account_cpf() -> str:
    """
    Generates a mathematically valid and unique CPF for service accounts.

    Loops until a CPF not present in the database is found.
    """
    cpf_generator = CPF()
    while True:
        cpf = cpf_generator.generate()
        if not UserAccount.objects.filter(cpf=cpf).exists():
            return cpf


class CustomJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication class that allows for authentication using both
    Authorization header (Bearer token) and cookies.

    This class extends the default JWTAuthentication class from
    rest_framework_simplejwt and overrides the 'authenticate' method.

    The authentication process first checks for the JWT token in the
    Authorization header. If not found, it attempts to retrieve the token
    from a cookie specified by the 'AUTH_COOKIE' setting.

    If a token is found in either location, it is validated using the
    standard JWT validation process. If validation is successful, the
    authenticated user and the validated token are returned. Otherwise,
    None is returned, indicating authentication failure.
    """

    def authenticate(self, request: Request):
        """
        Authenticates the user based on a JWT token provided in the
        Authorization header or a cookie.

        Args:
            request (Request): The incoming HTTP request.

        Returns:
            Tuple[User, str] | None: A tuple containing the authenticated
            user and the validated token if authentication is successful.
            Otherwise, returns None.
        """
        try:
            header = self.get_header(request)

            if header is None:
                raw_token = request.COOKIES.get(settings.AUTH_COOKIE)
            else:
                raw_token = self.get_raw_token(header)

            if raw_token is None:
                return None

            validated_token = self.get_validated_token(raw_token)

            return self.get_user(validated_token), validated_token
        except (AuthenticationFailed, TokenError):
            return None


class GoogleOIDCAuthentication(BaseAuthentication):
    """
    DRF authentication class to validate Google OIDC bearer tokens for service-to-service requests.
    Returns (user, None) on success or None to allow other authentication classes to try.
    """

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization") or ""
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ", 1)[1].strip()

        try:
            audience = settings.OIDC_AUDIENCE
            if not audience:
                return None

            claims = id_token.verify_oauth2_token(
                token,
                GoogleAuthRequest(),
                audience=audience,
            )

            issuer = claims.get("iss")
            if issuer not in ("accounts.google.com", "https://accounts.google.com"):
                return None

            service_account_email = claims.get("email")
            if not service_account_email:
                return None

            try:
                user = UserAccount.objects.get(email=service_account_email)
            except UserAccount.DoesNotExist:
                user = UserAccount.objects.create_user(
                    cpf=generate_unique_service_account_cpf(),
                    email=service_account_email,
                    password=None,
                    name="Cloud Scheduler",
                    role=UserAccount.Role.SERVICE_ACCOUNT,
                )

            return (user, None)

        except (ValueError, jwt.InvalidTokenError):
            return None


class OIDCAuthenticationBackend:
    """
    A custom Django authentication backend to validate OIDC tokens from Google.

    This backend is designed to authenticate requests from services like Cloud Scheduler
    by validating the OIDC token in the 'Authorization' header.
    """

    def authentication(self, request: HttpRequest) -> tuple[UserAccount, None] | None:
        """
        Authenticates the request by validating the OIDC token.

        Args:
            request: The HttpRequest object.

        Returns:
            A tuple of (user, None) if authentication is successful, otherwise None.
        """
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ")[1]

        try:
            audience = settings.OIDC_AUDIENCE
            if not audience:
                raise ValueError("OIDC_AUDIENCE setting is not configured.")

            claims = id_token.verify_oauth2_token(
                token,
                GoogleAuthRequest(),
                audience=audience,
            )

            issuer = claims.get("iss")
            if issuer not in ["accounts.google.com", "https://accounts.google.com"]:
                raise ValueError("Incorrect token issuer.")

            service_account_email = claims.get("email")
            if not service_account_email:
                return None

            user, created = UserAccount.objects.get_or_create(
                email=service_account_email,
                defaults={
                    "name": "Service Account",
                    "role": UserAccount.Role.SERVICE_ACCOUNT,
                },
            )

            if created:
                print(f"Created new user for service account: {service_account_email}")

            return (user, None)

        except (ValueError, jwt.InvalidTokenError) as e:
            print(f"OIDC token validation failed: {e}")
            return None

    def get_user(self, user_id: int) -> UserAccount | None:
        """
        Allows Django to retrieve the user object by its primary key.
        """
        try:
            return UserAccount.objects.get(pk=user_id)
        except UserAccount.DoesNotExist:
            return None
