import pytest
from django.http import QueryDict
from rest_framework.exceptions import ParseError
from rest_framework.parsers import JSONParser, MultiPartParser
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from core.request_data import request_body_mapping


def test_request_body_mapping_returns_json_object():
    # ARRANGE
    django_request = APIRequestFactory().post("/", {"unit": 1}, format="json")
    request = Request(django_request, parsers=[JSONParser()])

    # ACT
    data = request_body_mapping(request)

    # ASSERT
    assert data == {"unit": 1}


def test_request_body_mapping_accepts_form_data():
    # ARRANGE
    django_request = APIRequestFactory().post("/", {"hard": "true"})
    request = Request(django_request, parsers=[MultiPartParser()])

    # ACT
    data = request_body_mapping(request)

    # ASSERT
    assert isinstance(data, QueryDict)
    assert data.get("hard") == "true"


def test_request_body_mapping_rejects_json_array():
    # ARRANGE
    django_request = APIRequestFactory().post("/", [1, 2], format="json")
    request = Request(django_request, parsers=[JSONParser()])

    # ACT / ASSERT
    with pytest.raises(ParseError):
        request_body_mapping(request)
