#!/bin/bash
# WARNING: LOCAL DEVELOPMENT AND E2E TESTING ONLY.
# NEVER run against a production or staging Cloud SQL instance.
# This script irreversibly destroys all data (flush) and reseeds
# with synthetic fixtures. Cloud SQL deletion protection will not
# prevent application-level data loss from this script.

# Echo "yes" and flush the database
echo -e "yes" | python manage.py flush

# Remove all local media files
python manage.py clean_local_media --force

# Run the populate command
python manage.py populate
