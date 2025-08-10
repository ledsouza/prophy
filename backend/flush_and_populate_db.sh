#!/bin/bash

# Echo "yes" and flush the database
echo -e "yes" | python manage.py flush

# Remove all media files
rm -rf media/equipments/photos/*
rm -rf media/reports/*

# Run the populate command
python manage.py populate