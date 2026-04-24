#!/bin/sh
set -e

ensure_fixture_path() {
    if [ -z "${CYPRESS_FIXTURE_PATH:-}" ]; then
        return
    fi

    mkdir -p "$CYPRESS_FIXTURE_PATH"
    chown -R appuser:appuser "$CYPRESS_FIXTURE_PATH"
}

run_migrations() {
    python manage.py migrate
}

collect_static_files() {
    python manage.py collectstatic --noinput
}

start_gunicorn() {
    su appuser -s /bin/sh -c "gunicorn core.wsgi:application --bind 0.0.0.0:${PORT:-8080}"
}

ensure_fixture_path
run_migrations
collect_static_files
start_gunicorn