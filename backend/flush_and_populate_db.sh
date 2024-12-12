#!/bin/bash

# Echo "yes" and flush the database
echo -e "yes" | python manage.py flush

# Run the populate command
python manage.py populate