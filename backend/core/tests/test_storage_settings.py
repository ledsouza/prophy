import pytest
from django.core.exceptions import ImproperlyConfigured

from core.settings.base import build_production_storages


def test_build_production_storages_requires_bucket(monkeypatch):
    monkeypatch.delenv("GCS_BUCKET_NAME", raising=False)

    with pytest.raises(ImproperlyConfigured):
        build_production_storages()


def test_build_production_storages_uses_gcs_for_media(monkeypatch):
    monkeypatch.setenv("GCS_BUCKET_NAME", "test-bucket")

    storages = build_production_storages()

    assert (
        storages["default"]["BACKEND"]
        == "storages.backends.gcloud.GoogleCloudStorage"
    )
    options = storages["default"]["OPTIONS"]
    assert options["bucket_name"] == "test-bucket"
    assert options["iam_sign_blob"] is True
    assert options["location"] == "media"
    assert "credentials" not in options
    assert "project_id" not in options
    assert storages["staticfiles"]["BACKEND"] == (
        "whitenoise.storage.CompressedManifestStaticFilesStorage"
    )
