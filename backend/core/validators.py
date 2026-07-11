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


class MaxFileSize:
    """
    Validator to ensure an uploaded file does not exceed a maximum size.

    Args:
        max_size_mb (int): The maximum allowed file size, in megabytes.

    Raises:
        ValidationError: If the uploaded file's size exceeds the limit.

    Example:
        To use this validator in a Django model field:

        ```python
        from django.db import models

        class MyModel(models.Model):
            my_file = models.FileField(validators=[MaxFileSize(5)])
        ```

        This will ensure that `my_file` is never larger than 5MB.
    """

    def __init__(self, max_size_mb: int):
        self.max_size_mb = max_size_mb

    def __call__(self, value):
        try:
            file_size = value.size
        except (FileNotFoundError, OSError):
            # A committed FieldFile whose underlying storage entry is
            # missing has no size to check. Newly uploaded files always
            # expose .size directly without touching storage, so this
            # only affects already-persisted references, not new
            # uploads.
            return

        max_size_bytes = self.max_size_mb * 1024 * 1024
        if file_size > max_size_bytes:
            message = f"O arquivo não pode ser maior que {self.max_size_mb}MB."
            raise ValidationError(message)

    def deconstruct(self):
        """
        Tells Django how to deconstruct this validator for migrations.
        """
        path = "core.validators.MaxFileSize"
        args = (self.max_size_mb,)
        kwargs = {}
        return (path, args, kwargs)
