import factory
from django.core.files.uploadedfile import SimpleUploadedFile

from materials.models import InstitutionalMaterial
from users.models import UserAccount


class InstitutionalMaterialFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = InstitutionalMaterial

    title = factory.Sequence(lambda n: f"Material {n}")
    description = factory.Faker("sentence")
    visibility = InstitutionalMaterial.Visibility.PUBLIC
    category = InstitutionalMaterial.PublicCategory.SIGNS
    file = factory.LazyFunction(
        lambda: SimpleUploadedFile(
            "material.pdf",
            b"file_content",
            content_type="application/pdf",
        )
    )

    @factory.post_generation
    def allowed_external_users(
        self,
        create: bool,
        extracted: list[UserAccount] | None,
        **kwargs,
    ) -> None:
        if not create:
            return
        if extracted is None:
            return

        self.allowed_external_users.set(extracted)
