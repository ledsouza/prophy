from __future__ import annotations

from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Delete local media files when running in DEBUG."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Confirm deletion of local media files.",
        )

    def handle(self, *args, **options):
        if not settings.DEBUG and not settings.ENABLE_CYPRESS_ROUTES:
            raise CommandError(
                "Local media cleanup is only allowed in DEBUG or E2E mode."
            )

        if not options["force"]:
            raise CommandError("Pass --force to delete local media files.")

        media_root = Path(settings.MEDIA_ROOT)
        if not media_root.exists():
            self.stdout.write(self.style.WARNING("MEDIA_ROOT does not exist."))
            return

        deleted = 0
        for entry in media_root.iterdir():
            if entry.is_dir():
                for child in entry.rglob("*"):
                    if child.is_file():
                        child.unlink()
                        deleted += 1

                # Reverse sorting helps remove deeper paths first,
                # avoiding “directory not empty” errors.
                for child in sorted(entry.rglob("*"), reverse=True):
                    if child.is_dir():
                        child.rmdir()
                entry.rmdir()
                continue

            if entry.is_file():
                entry.unlink()
                deleted += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Deleted {deleted} local media file(s) from {media_root}."
            )
        )
