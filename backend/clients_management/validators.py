from django.core.exceptions import ValidationError
from validate_docbr import CNPJ


class CNPJValidator:
    """
    Validator for Brazilian CNPJ (Cadastro Nacional da Pessoa Jurídica) numbers.

    Raises:
        ValidationError: If the provided value is not a valid CNPJ.

    Example:
        To use this validator in a Django model field:

        ```python
        class MyModel(models.Model):
            cnpj = models.CharField(max_length=14, validators=[CNPJValidator()])
        ```

        This will ensure that `cnpj` field always contains a valid CNPJ.
    """

    def __call__(self, value: str):
        cnpj_validator = CNPJ()
        if not cnpj_validator.validate(value):
            raise ValidationError("CNPJ inválido.")

    def deconstruct(self):
        """
        Tells Django how to deconstruct this validator for migrations.
        """
        path = "clients_management.validators.CNPJValidator"
        args = ()
        kwargs = {}
        return (path, args, kwargs)
