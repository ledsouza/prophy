import factory

from users.models import UserAccount


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = UserAccount

    cpf = factory.Sequence(lambda n: f"{n + 10_000_000_000}")
    email = factory.Sequence(lambda n: f"user{n}@example.com")
    name = factory.Faker("name")
    phone = factory.Sequence(lambda n: f"11{900000000 + n:09d}")
    role = UserAccount.Role.CLIENT_GENERAL_MANAGER

    password = factory.PostGenerationMethodCall("set_password", "testpass123")
