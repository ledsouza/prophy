from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError

User = get_user_model()


class UserAccountManagerTests(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(
            cpf='12345678901',
            email='test@example.com',
            password='testpass123',
            name='Test User'
        )
        self.assertEqual(user.cpf, '12345678901')
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_with_invalid_role(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(
                cpf='12345678901',
                email='test@example.com',
                password='testpass123',
                role='Invalid role'
            )

    def test_create_user_without_cpf(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(
                cpf='',
                email='test@example.com',
                password='testpass123'
            )

    def test_create_user_without_email(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(
                cpf='12345678901',
                email='',
                password='testpass123'
            )

    def test_create_superuser(self):
        admin_user = User.objects.create_superuser(
            cpf='98765432109',
            email='admin@example.com',
            password='admin123',
            name='Admin User'
        )
        self.assertEqual(admin_user.cpf, '98765432109')
        self.assertEqual(admin_user.email, 'admin@example.com')
        self.assertTrue(admin_user.is_active)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)


class UserAccountTests(TestCase):
    def test_user_creation(self):
        user = User.objects.create_user(
            cpf='12345678901',
            email='test@example.com',
            password='testpass123',
            name='Test User'
        )
        self.assertEqual(user.name, 'Test User')
        self.assertEqual(user.role, 'Gerente Geral do Cliente')

    def test_cpf_validator(self):
        with self.assertRaises(ValidationError):
            user = User(
                cpf='invalid_cpf',
                email='test@example.com',
                name='Test User'
            )
            user.full_clean()

    def test_name_validator(self):
        with self.assertRaises(ValidationError):
            user = User(
                cpf='12345678901',
                email='test@example.com',
                name='Test User 123'
            )
            user.full_clean()

    def test_unique_cpf(self):
        User.objects.create_user(
            cpf='12345678901',
            email='test1@example.com',
            password='testpass123',
            name='Test User 1'
        )
        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                cpf='12345678901',
                email='test2@example.com',
                password='testpass123',
                name='Test User 2'
            )

    def test_unique_email(self):
        User.objects.create_user(
            cpf='12345678901',
            email='test@example.com',
            password='testpass123',
            name='Test User 1'
        )
        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                cpf='98765432109',
                email='test@example.com',
                password='testpass123',
                name='Test User 2'
            )

    def test_user_group_assignment(self):
        user = User.objects.create_user(
            cpf='12345678901',
            email='test@example.com',
            password='testpass123',
            name='Test User',
            role='Físico Médico Interno'
        )
        self.assertTrue(user.groups.filter(
            name='Físico Médico Interno').exists())
