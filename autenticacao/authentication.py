from django.conf import settings
from rest_framework.request import Request
from rest_framework_simplejwt.authentication import JWTAuthentication


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
        except:
            return None
