#!/bin/sh
set -e

if [ -n "${CYPRESS_FIXTURE_PATH:-}" ]; then
    mkdir -p "$CYPRESS_FIXTURE_PATH"
    chown -R appuser:appuser "$CYPRESS_FIXTURE_PATH"
fi

python manage.py migrate

exec gunicorn core.wsgi:application --bind 0.0.0.0:${PORT:-8080}