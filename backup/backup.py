#!/usr/bin/env python3
"""Nightly encrypted backup of the ERP database (spec 040).

    backup.py run-once            dump, encrypt, upload, then prune (what the nightly job does)
    backup.py run-daily --at 03:00   do run-once every day at that local time (the container's command)
    backup.py status              list the backups; exit 1 when the newest is older than 26 hours
    backup.py restore NAME --database DB    decrypt a backup and restore it into an existing database

The dump is `pg_dump -Fc`, encrypted with `openssl enc -aes-256-cbc -pbkdf2` and a passphrase that only the VPS
`.env` holds. Restoring needs nothing from this project: `openssl enc -d ... | pg_restore` (see operations.md).
Standard library only, plus `boto3` for the real bucket.
"""

import argparse
import datetime as dt
import os
import re
import subprocess
import sys
import tempfile
import time
from collections.abc import Callable, Sequence
from pathlib import Path
from typing import Protocol

PREFIX = "db/"
NAME_PATTERN = re.compile(r"^erp-(\d{8})-(\d{6})\.dump\.enc$")
DAILY_DAYS = 30
MONTHLY_MONTHS = 12
STALE_HOURS = 26
RETRY_SECONDS = 1800
RETRIES = 4
PBKDF2_ITERATIONS = "600000"


class BackupError(Exception):
    """A step of the backup failed; the message says which, never a secret."""


# ----- decisions (pure) -----


def backup_name(now: dt.datetime) -> str:
    return f"erp-{now:%Y%m%d-%H%M%S}.dump.enc"


def parse_name(name: str) -> dt.datetime | None:
    match = NAME_PATTERN.match(name)
    if match is None:
        return None
    return dt.datetime.strptime(f"{match.group(1)}{match.group(2)}", "%Y%m%d%H%M%S")


def select_backups_to_delete(names: Sequence[str], today: dt.date) -> list[str]:
    """What to delete: keep the last 30 days and the earliest backup of each of the last 12 months.

    A name that is not one of ours is never touched.
    """
    backups = sorted((parsed, name) for name in names if (parsed := parse_name(name)) is not None)
    daily_start = today - dt.timedelta(days=DAILY_DAYS)
    first_month = _months_back(today, MONTHLY_MONTHS - 1)
    keep: set[str] = set()
    earliest_of_month: dict[tuple[int, int], str] = {}
    for parsed, name in backups:
        if parsed.date() > daily_start:
            keep.add(name)
        earliest_of_month.setdefault((parsed.year, parsed.month), name)
    for (year, month), name in earliest_of_month.items():
        if (year, month) >= (first_month.year, first_month.month):
            keep.add(name)
    return [name for _, name in backups if name not in keep]


def _months_back(today: dt.date, months: int) -> dt.date:
    index = today.year * 12 + today.month - 1 - months
    return dt.date(index // 12, index % 12 + 1, 1)


def is_stale(newest: dt.datetime | None, now: dt.datetime) -> bool:
    return newest is None or now - newest > dt.timedelta(hours=STALE_HOURS)


# ----- where the copies live -----


class Bucket(Protocol):
    def list(self) -> list[tuple[str, int]]: ...
    def upload(self, path: Path, name: str) -> None: ...
    def download(self, name: str, path: Path) -> None: ...
    def delete(self, name: str) -> None: ...


class LocalBucket:
    """A directory: for tests and dry runs without a bucket."""

    def __init__(self, directory: Path) -> None:
        self.directory = directory
        directory.mkdir(parents=True, exist_ok=True)

    def list(self) -> list[tuple[str, int]]:
        return [(item.name, item.stat().st_size) for item in self.directory.iterdir() if item.is_file()]

    def upload(self, path: Path, name: str) -> None:
        (self.directory / name).write_bytes(path.read_bytes())

    def download(self, name: str, path: Path) -> None:
        path.write_bytes((self.directory / name).read_bytes())

    def delete(self, name: str) -> None:
        (self.directory / name).unlink()


class S3Bucket:
    """The private backup bucket (Cloudflare R2 speaks the S3 API)."""

    def __init__(self, endpoint_url: str, bucket: str, access_key_id: str, secret_access_key: str) -> None:
        import boto3  # only the real bucket needs it

        self._bucket = bucket
        self._client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            region_name="auto",
        )

    def list(self) -> list[tuple[str, int]]:
        found: list[tuple[str, int]] = []
        for page in self._client.get_paginator("list_objects_v2").paginate(Bucket=self._bucket, Prefix=PREFIX):
            found += [(item["Key"].removeprefix(PREFIX), item["Size"]) for item in page.get("Contents", [])]
        return found

    def upload(self, path: Path, name: str) -> None:
        self._client.upload_file(str(path), self._bucket, PREFIX + name)

    def download(self, name: str, path: Path) -> None:
        self._client.download_file(self._bucket, PREFIX + name, str(path))

    def delete(self, name: str) -> None:
        self._client.delete_object(Bucket=self._bucket, Key=PREFIX + name)


def bucket_from_env(env: dict[str, str]) -> Bucket:
    """The local directory when `BACKUP_LOCAL_DIR` is set (dry runs), else the bucket of the `BACKUP_S3_*` variables."""
    if env.get("BACKUP_LOCAL_DIR"):
        return LocalBucket(Path(env["BACKUP_LOCAL_DIR"]))
    missing = [key for key in _S3_KEYS if not env.get(key)]
    if missing:
        raise BackupError(f"missing settings: {', '.join(missing)}")
    return S3Bucket(
        env["BACKUP_S3_ENDPOINT_URL"], env["BACKUP_S3_BUCKET"], env["BACKUP_S3_ACCESS_KEY_ID"], env["BACKUP_S3_SECRET_ACCESS_KEY"]
    )


_S3_KEYS = ("BACKUP_S3_ENDPOINT_URL", "BACKUP_S3_BUCKET", "BACKUP_S3_ACCESS_KEY_ID", "BACKUP_S3_SECRET_ACCESS_KEY")


# ----- the dump and the restore -----


def _connection_env(env: dict[str, str]) -> dict[str, str]:
    return {
        **env,
        "PGHOST": env.get("POSTGRES_HOST", "db"),
        "PGPORT": env.get("POSTGRES_PORT", "5432"),
        "PGUSER": env["POSTGRES_USER"],
        "PGPASSWORD": env["POSTGRES_PASSWORD"],
    }


def _require_passphrase(env: dict[str, str]) -> None:
    if len(env.get("BACKUP_PASSPHRASE", "")) < 16:
        raise BackupError("BACKUP_PASSPHRASE must be set and at least 16 characters long")


def dump_encrypted(env: dict[str, str], destination: Path) -> None:
    """`pg_dump -Fc | openssl enc` into `destination`; the file is removed when either step fails."""
    _require_passphrase(env)
    connection = _connection_env(env)
    dump = subprocess.Popen(
        ["pg_dump", "--format=custom", "--no-owner", "--no-acl", "--dbname", env["POSTGRES_DB"]],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=connection,
    )
    with destination.open("wb") as target:
        encrypt = subprocess.Popen(
            ["openssl", "enc", "-aes-256-cbc", "-pbkdf2", "-iter", PBKDF2_ITERATIONS, "-salt", "-pass", "env:BACKUP_PASSPHRASE"],
            stdin=dump.stdout,
            stdout=target,
            stderr=subprocess.PIPE,
            env=connection,
        )
        assert dump.stdout is not None
        dump.stdout.close()
        encrypt_error = encrypt.communicate()[1]
        dump_error = dump.stderr.read() if dump.stderr else b""
        if dump.stderr:
            dump.stderr.close()
        dump.wait()
    if dump.returncode != 0 or encrypt.returncode != 0:
        destination.unlink(missing_ok=True)
        detail = (dump_error or encrypt_error).decode(errors="replace").strip().splitlines()[-1:]
        raise BackupError(f"dump failed (pg_dump {dump.returncode}, openssl {encrypt.returncode}) {' '.join(detail)}".strip())
    if destination.stat().st_size == 0:
        destination.unlink(missing_ok=True)
        raise BackupError("dump failed: the file is empty")


def restore_encrypted(env: dict[str, str], source: Path, database: str) -> None:
    """`openssl enc -d | pg_restore` into an existing database (the same thing the runbook does by hand)."""
    _require_passphrase(env)
    connection = _connection_env(env)
    with source.open("rb") as handle:
        decrypt = subprocess.Popen(
            ["openssl", "enc", "-d", "-aes-256-cbc", "-pbkdf2", "-iter", PBKDF2_ITERATIONS, "-pass", "env:BACKUP_PASSPHRASE"],
            stdin=handle,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=connection,
        )
        restore = subprocess.Popen(
            ["pg_restore", "--no-owner", "--no-acl", "--exit-on-error", "--dbname", database],
            stdin=decrypt.stdout,
            stderr=subprocess.PIPE,
            env=connection,
        )
        assert decrypt.stdout is not None
        decrypt.stdout.close()
        restore_error = restore.communicate()[1]
        decrypt.wait()
        if decrypt.stderr:
            decrypt.stderr.close()
    if decrypt.returncode != 0:
        raise BackupError("restore failed: openssl could not decrypt (wrong passphrase or a damaged file)")
    if restore.returncode != 0:
        raise BackupError(f"restore failed: {restore_error.decode(errors='replace').strip().splitlines()[-1:]}")


# ----- the jobs -----


def run_once(
    env: dict[str, str],
    bucket: Bucket,
    now: dt.datetime,
    dump: Callable[[dict[str, str], Path], None] = dump_encrypted,
) -> str:
    """Dump, encrypt, upload and only then prune; any failure raises before anything is deleted."""
    name = backup_name(now)
    with tempfile.TemporaryDirectory() as workdir:
        path = Path(workdir) / name
        dump(env, path)
        try:
            bucket.upload(path, name)
        except Exception as error:
            raise BackupError(f"upload failed: {type(error).__name__}") from None
    for old in select_backups_to_delete([item for item, _ in bucket.list()], now.date()):
        bucket.delete(old)
    return name


def status(bucket: Bucket, now: dt.datetime) -> tuple[list[str], bool]:
    """The lines to print and whether something is wrong (no backup, or the newest is too old)."""
    backups = sorted((parsed, name, size) for name, size in bucket.list() if (parsed := parse_name(name)) is not None)
    lines = [f"{name}  {size / 1_000_000:.1f} MB  {_age(now - parsed)} ago" for parsed, name, size in backups[-10:]]
    newest = backups[-1][0] if backups else None
    problem = is_stale(newest, now)
    lines.append(f"{len(backups)} backup(s); " + ("PROBLEM: no recent backup" if problem else "the newest is recent"))
    return lines, problem


def _age(delta: dt.timedelta) -> str:
    hours = int(delta.total_seconds() // 3600)
    return f"{hours // 24}d {hours % 24}h" if hours >= 24 else f"{hours}h"


def seconds_until(at: dt.time, now: dt.datetime) -> float:
    target = dt.datetime.combine(now.date(), at)
    if target <= now:
        target += dt.timedelta(days=1)
    return (target - now).total_seconds()


def run_daily(at: dt.time, env: dict[str, str]) -> None:  # pragma: no cover - the loop of the container
    while True:
        time.sleep(seconds_until(at, dt.datetime.now()))
        for attempt in range(1, RETRIES + 1):
            try:
                name = run_once(env, bucket_from_env(env), dt.datetime.now())
                print(f"backup ok: {name}", flush=True)
                break
            except BackupError as error:
                print(f"BACKUP FAILED (attempt {attempt}/{RETRIES}): {error}", file=sys.stderr, flush=True)
                if attempt < RETRIES:
                    time.sleep(RETRY_SECONDS)


def main(argv: Sequence[str] | None = None, env: dict[str, str] | None = None) -> int:
    environment = dict(os.environ if env is None else env)
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("run-once")
    daily = commands.add_parser("run-daily")
    daily.add_argument("--at", default="03:00", help="local time HH:MM")
    commands.add_parser("status")
    restore = commands.add_parser("restore")
    restore.add_argument("name")
    restore.add_argument("--database", required=True, help="an existing, empty database to restore into")
    args = parser.parse_args(argv)
    try:
        if args.command == "run-once":
            print(f"backup ok: {run_once(environment, bucket_from_env(environment), dt.datetime.now())}")
        elif args.command == "run-daily":
            run_daily(dt.datetime.strptime(args.at, "%H:%M").time(), environment)
        elif args.command == "status":
            lines, problem = status(bucket_from_env(environment), dt.datetime.now())
            print("\n".join(lines))
            return 1 if problem else 0
        else:
            with tempfile.TemporaryDirectory() as workdir:
                path = Path(workdir) / args.name
                bucket_from_env(environment).download(args.name, path)
                restore_encrypted(environment, path, args.database)
            print(f"restored {args.name} into {args.database}")
    except BackupError as error:
        print(f"BACKUP FAILED: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
