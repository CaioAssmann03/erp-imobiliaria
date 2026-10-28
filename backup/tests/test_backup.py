"""The nightly backup (spec 040): retention, failures, status, and a real dump/encrypt/restore round trip."""

import datetime as dt
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import backup  # noqa: E402

ENV = {
    "POSTGRES_HOST": os.environ.get("POSTGRES_HOST", "localhost"),
    "POSTGRES_PORT": os.environ.get("POSTGRES_PORT", "5432"),
    "POSTGRES_USER": os.environ.get("POSTGRES_USER", "postgres"),
    "POSTGRES_PASSWORD": os.environ.get("POSTGRES_PASSWORD", "postgres"),
    "POSTGRES_DB": "backup_test_source",
    "BACKUP_PASSPHRASE": "a-long-test-passphrase-not-a-secret",
    "PATH": os.environ.get("PATH", ""),
}


def name(day: dt.date, hour: int = 3) -> str:
    return backup.backup_name(dt.datetime.combine(day, dt.time(hour)))


class RetentionTest(unittest.TestCase):
    today = dt.date(2026, 10, 27)

    def test_the_last_30_days_are_kept_and_older_ones_go_unless_they_start_a_month(self) -> None:
        recent = [name(self.today - dt.timedelta(days=days)) for days in range(0, 30)]
        old_not_first = name(dt.date(2026, 8, 20))
        first_of_august = name(dt.date(2026, 8, 3))

        deleted = backup.select_backups_to_delete([*recent, old_not_first, first_of_august], self.today)

        self.assertEqual(deleted, [old_not_first])

    def test_the_earliest_backup_of_each_of_the_last_12_months_is_kept(self) -> None:
        names = [name(dt.date(2025, 11, 5)), name(dt.date(2025, 11, 20)), name(dt.date(2025, 10, 4)), name(dt.date(2026, 1, 2)), name(dt.date(2026, 1, 15))]

        deleted = backup.select_backups_to_delete(names, self.today)

        # November 2025 is inside the 12 months: its first stays; October 2025 is too old; January keeps its first.
        self.assertCountEqual(deleted, [name(dt.date(2025, 11, 20)), name(dt.date(2025, 10, 4)), name(dt.date(2026, 1, 15))])

    def test_a_file_that_is_not_ours_is_never_deleted(self) -> None:
        self.assertEqual(backup.select_backups_to_delete(["notes.txt", "erp-bad.dump.enc"], self.today), [])


class StatusTest(unittest.TestCase):
    now = dt.datetime(2026, 10, 27, 12, 0)

    def make_bucket(self, directory: str, *days_ago: int) -> backup.LocalBucket:
        bucket = backup.LocalBucket(Path(directory))
        for days in days_ago:
            (Path(directory) / backup.backup_name(self.now - dt.timedelta(days=days))).write_bytes(b"x")
        return bucket

    def test_a_recent_backup_is_fine(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            lines, problem = backup.status(self.make_bucket(directory, 0, 1), self.now)

        self.assertFalse(problem)
        self.assertIn("2 backup(s)", lines[-1])

    def test_no_backup_or_an_old_one_is_a_problem(self) -> None:
        with tempfile.TemporaryDirectory() as empty, tempfile.TemporaryDirectory() as old:
            self.assertTrue(backup.status(self.make_bucket(empty), self.now)[1])
            self.assertTrue(backup.status(self.make_bucket(old, 2), self.now)[1])

    def test_stale_after_26_hours(self) -> None:
        self.assertFalse(backup.is_stale(self.now - dt.timedelta(hours=25), self.now))
        self.assertTrue(backup.is_stale(self.now - dt.timedelta(hours=27), self.now))

    def test_the_daily_job_sleeps_until_the_next_time(self) -> None:
        self.assertEqual(backup.seconds_until(dt.time(3, 0), dt.datetime(2026, 10, 27, 2, 0)), 3600)
        self.assertEqual(backup.seconds_until(dt.time(3, 0), dt.datetime(2026, 10, 27, 4, 0)), 23 * 3600)


class FailureTest(unittest.TestCase):
    now = dt.datetime(2026, 10, 27, 3, 0)

    def old_backups(self, directory: str) -> list[str]:
        names = [name(dt.date(2026, 3, 20)), name(dt.date(2026, 3, 25))]
        for item in names:
            (Path(directory) / item).write_bytes(b"x")
        return names

    def test_a_failed_dump_deletes_nothing(self) -> None:
        def failing_dump(env: dict[str, str], destination: Path) -> None:
            raise backup.BackupError("dump failed")

        with tempfile.TemporaryDirectory() as directory:
            bucket = backup.LocalBucket(Path(directory))
            names = self.old_backups(directory)
            with self.assertRaises(backup.BackupError):
                backup.run_once(ENV, bucket, self.now, dump=failing_dump)

            self.assertCountEqual([item for item, _ in bucket.list()], names)

    def test_a_failed_upload_deletes_nothing(self) -> None:
        class BrokenBucket(backup.LocalBucket):
            def upload(self, path: Path, name: str) -> None:
                raise ConnectionError("secret-looking detail")

        def fake_dump(env: dict[str, str], destination: Path) -> None:
            destination.write_bytes(b"data")

        with tempfile.TemporaryDirectory() as directory:
            bucket = BrokenBucket(Path(directory))
            names = self.old_backups(directory)
            with self.assertRaises(backup.BackupError) as raised:
                backup.run_once(ENV, bucket, self.now, dump=fake_dump)

            self.assertCountEqual([item for item, _ in bucket.list()], names)
            self.assertNotIn("secret-looking", str(raised.exception))

    def test_a_good_run_uploads_then_prunes(self) -> None:
        def fake_dump(env: dict[str, str], destination: Path) -> None:
            destination.write_bytes(b"data")

        with tempfile.TemporaryDirectory() as directory:
            bucket = backup.LocalBucket(Path(directory))
            self.old_backups(directory)

            created = backup.run_once(ENV, bucket, self.now, dump=fake_dump)

            kept = [item for item, _ in bucket.list()]
            self.assertIn(created, kept)
            self.assertIn(name(dt.date(2026, 3, 20)), kept)  # the first of its month stays
            self.assertNotIn(name(dt.date(2026, 3, 25)), kept)  # the second of a month, older than 30 days, goes

    def test_a_short_passphrase_is_refused_before_anything_runs(self) -> None:
        with tempfile.TemporaryDirectory() as directory, self.assertRaises(backup.BackupError):
            backup.dump_encrypted({**ENV, "BACKUP_PASSPHRASE": "short"}, Path(directory) / "x")


def _psql(sql: str, database: str = "postgres") -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["psql", "-h", ENV["POSTGRES_HOST"], "-p", ENV["POSTGRES_PORT"], "-U", ENV["POSTGRES_USER"], "-d", database, "-tAc", sql],
        env={**os.environ, "PGPASSWORD": ENV["POSTGRES_PASSWORD"]},
        capture_output=True,
        text=True,
    )


def _postgres_available() -> bool:
    try:
        return subprocess.run(["pg_dump", "--version"], capture_output=True).returncode == 0 and _psql("select 1").returncode == 0
    except FileNotFoundError:
        return False


@unittest.skipUnless(_postgres_available(), "needs pg_dump, openssl and a reachable PostgreSQL")
class DumpAndRestoreTest(unittest.TestCase):
    def setUp(self) -> None:
        for database in ("backup_test_source", "backup_test_target"):
            _psql(f"drop database if exists {database}")
            self.assertEqual(_psql(f"create database {database}").returncode, 0)
        _psql("create table people (id serial primary key, name text); insert into people (name) select 'p' || g from generate_series(1, 250) g", "backup_test_source")

    def tearDown(self) -> None:
        for database in ("backup_test_source", "backup_test_target"):
            _psql(f"drop database if exists {database}")

    def test_the_file_is_encrypted_and_the_restore_brings_every_row_back(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            bucket = backup.LocalBucket(Path(directory))
            created = backup.run_once(ENV, bucket, dt.datetime(2026, 10, 27, 3, 0))
            stored = Path(directory, created).read_bytes()

            self.assertTrue(stored.startswith(b"Salted__"))  # openssl's header: encrypted
            self.assertNotIn(b"PGDMP", stored)  # the pg_dump header is not readable
            target = Path(directory) / "restored.enc"
            bucket.download(created, target)
            backup.restore_encrypted(ENV, target, "backup_test_target")

        self.assertEqual(_psql("select count(*) from people", "backup_test_target").stdout.strip(), "250")

    def test_a_wrong_passphrase_cannot_restore(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            bucket = backup.LocalBucket(Path(directory))
            created = backup.run_once(ENV, bucket, dt.datetime(2026, 10, 27, 3, 0))
            target = Path(directory) / "restored.enc"
            bucket.download(created, target)

            with self.assertRaises(backup.BackupError):
                backup.restore_encrypted({**ENV, "BACKUP_PASSPHRASE": "another-long-wrong-passphrase"}, target, "backup_test_target")

    def test_a_missing_database_fails_without_leaving_a_file(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(backup.BackupError):
                backup.dump_encrypted({**ENV, "POSTGRES_DB": "does_not_exist_anywhere"}, Path(directory) / "x.enc")

            self.assertFalse((Path(directory) / "x.enc").exists())


if __name__ == "__main__":
    unittest.main()
