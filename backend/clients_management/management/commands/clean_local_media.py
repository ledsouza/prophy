from __future__ import annotations

import shutil
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
        if not settings.DEBUG and not settings.ALLOW_LOCAL_MEDIA_CLEANUP:
            raise CommandError(
                "Local media cleanup is only allowed in DEBUG or staging mode."
            )

        if not options["force"]:
            raise CommandError("Pass --force to delete local media files.")

        media_root = Path(settings.MEDIA_ROOT)
        if not media_root.exists():
            self.stdout.write(self.style.WARNING("MEDIA_ROOT does not exist."))
            return

        # MEDIA_ROOT itself is a Docker volume mount point in staging, so
        # it can't be removed and recreated with shutil.rmtree(media_root)
        # (that raises "Device or resource busy"). Clear its contents
        # instead, leaving the mount point in place.
        entries = list(media_root.iterdir())
        for entry in entries:
            if entry.is_dir() and not entry.is_symlink():
                shutil.rmtree(entry)
            else:
                entry.unlink()

        self.stdout.write(
            self.style.SUCCESS(
                f"Removed {len(entries)} top-level entries from {media_root}."
            )
        )
