# syntax=docker/dockerfile:1

FROM python:3.12-slim-bookworm AS python-base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    POETRY_VERSION=2.1.4 \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    POETRY_HOME="/opt/poetry" \
    PYSETUP_PATH="/opt/pysetup" \
    VENV_PATH="/opt/pysetup/.venv"

ENV PATH="$POETRY_HOME/bin:$VENV_PATH/bin:$PATH"

RUN groupadd --gid 10001 appuser \
    && useradd --uid 10001 --gid appuser --shell /bin/bash --create-home appuser


FROM python-base AS builder-base

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        libpq-dev \
        libjpeg62-turbo-dev \
        zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

RUN --mount=type=cache,target=/root/.cache \
    curl -sSL https://install.python-poetry.org | python3 -

WORKDIR $PYSETUP_PATH

COPY backend/pyproject.toml backend/poetry.lock ./

RUN --mount=type=cache,target=/root/.cache \
    poetry install --only main --no-root


FROM python-base AS dev

COPY --from=builder-base $POETRY_HOME $POETRY_HOME
COPY --from=builder-base $PYSETUP_PATH $PYSETUP_PATH

WORKDIR $PYSETUP_PATH

RUN --mount=type=cache,target=/root/.cache \
    poetry install --with dev --no-root

WORKDIR /app

RUN chown -R appuser:appuser /app

USER appuser

CMD ["sh", "-c", "cd /app/backend && python manage.py runserver 0.0.0.0:8000"]


FROM python-base AS prod

COPY --from=builder-base $PYSETUP_PATH $PYSETUP_PATH

RUN pip install "gunicorn==23.0.0"

COPY backend /app

RUN chmod +x /app/scripts/e2e-entrypoint.sh

RUN chown -R appuser:appuser /app

RUN usermod --shell /usr/sbin/nologin appuser

WORKDIR /app

USER appuser

ENV DJANGO_SETTINGS_MODULE=core.settings.prod

CMD ["sh", "-c", "gunicorn core.wsgi:application --bind 0.0.0.0:${PORT:-8080}"]


FROM prod AS e2e

COPY --from=builder-base $POETRY_HOME $POETRY_HOME

WORKDIR $PYSETUP_PATH

USER root

RUN --mount=type=cache,target=/root/.cache \
    $POETRY_HOME/bin/poetry install --with dev --no-root

WORKDIR /app

ENV DJANGO_SETTINGS_MODULE=core.settings.e2e