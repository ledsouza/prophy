from django.core.exceptions import ValidationError
import re
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


class MobilePhoneValidator:
    """
    Validator for Brazilian mobile phone numbers.

    Ensures the number is 11 digits long, starts with a valid area code,
    and has a 9-digit local number starting with '9'.

    Raises:
        ValidationError: If the provided value is not a valid Brazilian mobile phone number.

    Example:
        To use this validator in a Django model field:

        ```python
        from django.db import models

        class MyModel(models.Model):
            mobile_number = models.CharField(max_length=11, validators=[MobilePhoneValidator()])
        ```

        This will ensure that `mobile_number` field always contains a valid Brazilian mobile number.
    """

    def __call__(self, value: str):
        # Pattern to match Brazilian mobile numbers in the format "11987654321"
        pattern = r'^\d{2}9\d{8}$'

        if not re.match(pattern, value):
            raise ValidationError(
                "Número de celular inválido. Deve estar no formato de 11 dígitos (ex: 11987654321).")

    def deconstruct(self):
        """
        Tells Django how to deconstruct this validator for migrations.
        """
        path = "users.validators.MobilePhoneValidator"
        args = ()
        kwargs = {}
        return (path, args, kwargs)
