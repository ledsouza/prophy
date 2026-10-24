from collections.abc import Mapping

from django.utils.translation import gettext as _
from rest_framework.exceptions import ParseError
from rest_framework.request import Request


def request_body_mapping(request: Request) -> Mapping[str, object]:
    """Return the parsed request body, rejecting a top-level JSON array.

    DRF parses a JSON array body into a list, which views reading
    fields by key cannot handle; raising ``ParseError`` turns that
    into a 400 response instead of a 500.

    Args:
        request: The incoming DRF request.

    Returns:
        The parsed body as a mapping (a dict or a ``QueryDict``).

    Raises:
        ParseError: If the body is a JSON array.
    """
    data = request.data
    if isinstance(data, list):
        raise ParseError(_("Request body must be a JSON object."))
    return data
