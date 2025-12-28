import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from users.models import UserAccount

User = get_user_model()


@pytest.mark.django_db
def test_create_user_default_role():
    user = User.objects.create_user(
        cpf="12345678901",
        email="test@example.com",
        password="testpass123",
        name="Test User",
        phone="11999999991",
    )

    assert user.cpf == "12345678901"
    assert user.email == "test@example.com"
    assert user.is_active is True
    assert user.is_staff is False
    assert user.is_superuser is False
    assert user.role == UserAccount.Role.CLIENT_GENERAL_MANAGER


@pytest.mark.django_db
def test_create_user_with_invalid_role_raises():
    with pytest.raises(ValueError):
        User.objects.create_user(
            cpf="12345678901",
            email="test@example.com",
            password="testpass123",
            name="Test User",
            phone="11999999991",
            role="Invalid role",
        )


@pytest.mark.django_db
def test_create_user_without_cpf_raises():
    with pytest.raises(ValueError):
        User.objects.create_user(
            cpf="",
            email="test@example.com",
            password="testpass123",
            name="Test User",
            phone="11999999991",
        )


@pytest.mark.django_db
def test_create_user_without_email_raises():
    with pytest.raises(ValueError):
        User.objects.create_user(
            cpf="12345678901",
            email="",
            password="testpass123",
            name="Test User",
            phone="11999999991",
        )


@pytest.mark.django_db
def test_create_superuser_sets_staff_and_superuser():
    admin_user = User.objects.create_superuser(
        cpf="98765432109",
        email="admin@example.com",
        password="admin123",
        name="Admin User",
        phone="11999999992",
    )

    assert admin_user.is_active is True
    assert admin_user.is_staff is True
    assert admin_user.is_superuser is True
    assert admin_user.role == UserAccount.Role.PROPHY_MANAGER


@pytest.mark.django_db
def test_user_full_clean_invalid_cpf_raises():
    user = User(
        cpf="invalid_cpf",
        email="test@example.com",
        name="Test User",
        phone="11999999991",
    )

    with pytest.raises(ValidationError):
        user.full_clean()


@pytest.mark.django_db
def test_unique_cpf_constraint_raises_integrity_error():
    User.objects.create_user(
        cpf="12345678901",
        email="test1@example.com",
        password="testpass123",
        name="Test User 1",
        phone="11999999991",
    )

    with pytest.raises(IntegrityError):
        User.objects.create_user(
            cpf="12345678901",
            email="test2@example.com",
            password="testpass123",
            name="Test User 2",
            phone="11999999992",
        )


@pytest.mark.django_db
def test_unique_email_constraint_raises_integrity_error():
    User.objects.create_user(
        cpf="12345678901",
        email="test@example.com",
        password="testpass123",
        name="Test User 1",
        phone="11999999991",
    )

    with pytest.raises(IntegrityError):
        User.objects.create_user(
            cpf="98765432109",
            email="test@example.com",
            password="testpass123",
            name="Test User 2",
            phone="11999999992",
        )


@pytest.mark.django_db
def test_user_added_to_group_matching_role():
    user = User.objects.create_user(
        cpf="12345678901",
        email="test@example.com",
        password="testpass123",
        name="Test User",
        phone="11999999991",
        role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
    )

    assert user.groups.filter(name=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST).exists()
