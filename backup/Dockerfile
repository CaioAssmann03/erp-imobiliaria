# The nightly backup of the ERP database (spec 040). Same major version as the `db` service, so pg_dump always matches.
FROM postgres:16

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-boto3 openssl ca-certificates tzdata \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /backup
COPY backup.py .

# The image's entrypoint would start a PostgreSQL server; this container only runs the job.
ENTRYPOINT []
CMD ["python3", "backup.py", "run-daily", "--at", "03:00"]
