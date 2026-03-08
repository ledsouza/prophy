#!/bin/bash

# Echo "yes" and flush the database
echo -e "yes" | python manage.py flush

# Remove all local media files
python manage.py clean_local_media --force

# Run the populate command
python manage.py populate
