"""
Utility functions for file handling in the clients_management app.
"""

import mimetypes


def get_content_type_from_filename(filename: str) -> str:
    """
    Determine the appropriate Content-Type based on file extension.

    Args:
        filename: The name of the file (with extension).

    Returns:
        The MIME type string for the file.
        Defaults to 'application/octet-stream' if type cannot be determined.
    """
    if not filename:
        return "application/octet-stream"

    content_type, _ = mimetypes.guess_type(filename)

    return content_type or "application/octet-stream"
