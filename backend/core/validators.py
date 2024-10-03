from django.core.exceptions import ValidationError


class FixedLength:
    """
    Validator to ensure a field has an exact length.

    Args:
        length (int): The required length of the field.

    Raises:
        ValidationError: If the provided value's length doesn't match the specified length.

    Example:
        To use this validator in a Django model field:

        ```python
        from django.db import models

        class MyModel(models.Model):
            my_field = models.CharField(max_length=10, validators=[FixedLength(10)])
        ```

        This will ensure that `my_field` always has exactly 10 characters.
    """

    def __init__(self, length: int):
        self.length = length

    def __call__(self, value: str):
        if len(value) != self.length:
            message = f"Este campo deve conter {self.length} caracteres."
            raise ValidationError(message)

    def deconstruct(self):
        """
        Tells Django how to deconstruct this validator for migrations.
        """
        path = "core.validators.FixedLength"
        args = (self.length,)
        kwargs = {}
        return (path, args, kwargs)


class AlphaOnly:
    """
    Validator to ensure a field contains only alphabetic characters.

    Raises:
        ValidationError: If the provided value contains non-alphabetic characters.

    Example:
        To use this validator in a Django model field:

        ```python
        from django.db import models

        class MyModel(models.Model):
            my_field = models.CharField(max_length=50, validators=[AlphaOnly()])
        ```

        This will ensure that `my_field` only contains alphabetic characters.
    """

    def __call__(self, value: str):
        if not value.replace(" ", "").isalpha():
            message = "Este campo deve conter apenas letras."
            raise ValidationError(message)

    def deconstruct(self):
        """
        Tells Django how to deconstruct this validator for migrations.
        """
        path = "core.validators.AlphaOnly"
        args = ()
        kwargs = {}
        return (path, args, kwargs)
