from django.core.exceptions import ValidationError
from validate_docbr import CPF


class CPFValidator:
    """
    Validator for Brazilian CPF (Cadastro de Pessoas Físicas) numbers.

    Raises:
        ValidationError: If the provided value is not a valid CPF.

    Example:
        To use this validator in a Django model field:

        ```python
        from django.db import models

        class MyModel(models.Model):
            cpf = models.CharField(max_length=11, validators=[CPFValidator()])
        ```

        This will ensure that `cpf` field always contains a valid CPF.
    """

    def __call__(self, value: str):
        cpf_validator = CPF()
        if not cpf_validator.validate(value):
            raise ValidationError("CPF inválido.")

    def deconstruct(self):
        """
        Tells Django how to deconstruct this validator for migrations.
        """
        path = "users.validators.CPFValidator"
        args = ()
        kwargs = {}
        return (path, args, kwargs)
