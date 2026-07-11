from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = (
        "Reset the database and media, then seed deterministic Cypress "
        "fixtures. Combines flush + clean_local_media + seed_cypress in "
        "a single management-command call so Cypress only needs one "
        "HTTP round-trip per db:seed task."
    )

    def handle(self, *args, **options):
        call_command("flush", "--no-input")
        call_command("clean_local_media", "--force")
        call_command("seed_cypress")
