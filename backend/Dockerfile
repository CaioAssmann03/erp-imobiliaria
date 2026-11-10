FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc libpango-1.0-0 libpangoft2-1.0-0 fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# requirements.txt is a lockfile (pip-compile): --require-hashes refuses any package whose SHA-256 is not listed in it.
RUN pip install --no-cache-dir --require-hashes -r requirements.txt

# The app runs without root (spec 065); /app is owned by that user because it writes `staticfiles/` and `celerybeat-schedule` there.
RUN useradd --system --create-home --uid 10001 app && chown app:app /app
COPY --chown=app:app . .
USER app

EXPOSE 8000

CMD ["sh", "entrypoint.sh"]
