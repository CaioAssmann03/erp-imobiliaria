#!/usr/bin/env python3
"""Check the backend docs: headers, links, roadmap statuses and spec rules.

Run from anywhere:  python backend/docs/tools/check_docs.py
Exit code 1 (and a list of problems) when something is inconsistent. Standard library only.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

DOCS = Path(__file__).resolve().parents[1]
DOC_ROOTS = ("architecture", "conventions", "apps", "features", "roadmap")
PART_STATUSES = {"todo", "in-progress", "blocked", "done", "moved"}
PHASE_STATUSES = {"todo", "in-progress", "done"}
SPEC_STATUSES = {"draft", "ready", "in-progress", "done", "dropped"}
SPEC_LEVELS = {"full", "lite"}
CLOSED_PART_STATUSES = {"done", "moved"}
STATUS_PATTERN = re.compile(r"\*\*Status:\*\*\s*([a-z-]+)")

problems: list[str] = []


def report(path: Path, message: str) -> None:
    problems.append(f"{path.relative_to(DOCS)}: {message}")


def read_status(text: str) -> str | None:
    match = STATUS_PATTERN.search(text)
    return match.group(1) if match else None


def section(text: str, heading: str) -> str:
    match = re.search(rf"^## {re.escape(heading)}\n(.*?)(?=^## |\Z)", text, re.S | re.M)
    return match.group(1) if match else ""


def check_header(path: Path, lines: list[str]) -> None:
    keys = ("summary:", "read-when:", "skip-if:")
    if len(lines) < 5 or lines[0] != "---" or lines[4] != "---":
        report(path, "missing the 5-line header (--- / summary / read-when / skip-if / ---)")
        return
    for line, key in zip(lines[1:4], keys):
        if not line.startswith(key):
            report(path, f"header line should start with '{key}'")


def check_links(path: Path, text: str) -> None:
    for target in re.findall(r"\]\(([^)\s]+)\)", text):
        if target.startswith(("http://", "https://", "mailto:", "#")):
            continue
        resolved = (path.parent / target.split("#")[0]).resolve()
        if not resolved.exists():
            report(path, f"broken link: {target}")
    root_alternatives = "|".join(DOC_ROOTS)
    for reference in re.findall(rf"(?<![\w/.<-])((?:{root_alternatives})/[\w./-]*\.md)", text):
        if "NNN" not in reference and not (DOCS / reference).exists():
            report(path, f"reference to a missing doc: {reference}")


def check_roadmap() -> None:
    roadmap = DOCS / "roadmap"
    index_path = roadmap / "README.md"
    index_text = index_path.read_text()
    index_rows = {
        match.group(3): (match.group(4), match.group(5))
        for match in re.finditer(r"^\| (\d+[a-z]?) \| \[[^\]]+\]\(((phase-[^/]+)/README\.md)\) \| ([\w-]+) \| (\d+/\d+) \|", index_text, re.M)
    }
    phase_dirs = sorted(path for path in roadmap.glob("phase-*") if path.is_dir())
    for phase_dir in phase_dirs:
        readme = phase_dir / "README.md"
        if not readme.exists():
            report(roadmap, f"{phase_dir.name} has no README.md")
            continue
        readme_text = readme.read_text()
        phase_status = read_status(readme_text)
        if phase_status not in PHASE_STATUSES:
            report(readme, f"invalid phase status: {phase_status}")
        part_statuses: dict[str, str | None] = {}
        for part in sorted(phase_dir.glob("[0-9][0-9]-*.md")):
            status = read_status(part.read_text())
            part_statuses[part.name] = status
            if status not in PART_STATUSES:
                report(part, f"invalid part status: {status}")
        table = dict(re.findall(r"^\| \d+ \| \[[^\]]+\]\(([^)]+)\) \| ([\w-]+) \|", readme_text, re.M))
        for file_name, status in part_statuses.items():
            if file_name not in table:
                report(readme, f"part {file_name} is not in the parts table")
            elif table[file_name] != status:
                report(readme, f"table says {table[file_name]} for {file_name}, the part says {status}")
        for file_name in table:
            if file_name not in part_statuses:
                report(readme, f"parts table lists a missing file: {file_name}")
        statuses = list(part_statuses.values())
        if statuses:
            if all(status in CLOSED_PART_STATUSES for status in statuses):
                expected = "done"
            elif all(status == "todo" for status in statuses):
                expected = "todo"
            else:
                expected = "in-progress"
            if phase_status != expected:
                report(readme, f"phase status is {phase_status} but its parts imply {expected}")
            closed = sum(1 for status in statuses if status in CLOSED_PART_STATUSES)
            indexed = index_rows.get(phase_dir.name)
            if indexed is None:
                report(index_path, f"{phase_dir.name} is not in the phases table")
            else:
                if indexed[0] != phase_status:
                    report(index_path, f"{phase_dir.name}: index says {indexed[0]}, the phase says {phase_status}")
                if indexed[1] != f"{closed}/{len(statuses)}":
                    report(index_path, f"{phase_dir.name}: index counts {indexed[1]}, parts give {closed}/{len(statuses)}")


def check_done_spec(spec: Path, text: str) -> None:
    criteria = re.findall(r"^- \[[ x]\] (R\d+)\b", section(text, "R — Requirements"), re.M)
    if not criteria:
        report(spec, "done spec has no numbered criteria (R1, R2...) in 'R — Requirements'")
    test_plan = section(text, "Test plan")
    for criterion in criteria:
        row = re.search(rf"^\|[^|\n]*\b{criterion}\b[^|\n]*\|\s*\S", test_plan, re.M)
        if not row:
            report(spec, f"criterion {criterion} has no row with a test (or a written gap) in 'Test plan'")
    definition = section(text, "Definition of done")
    if not definition.strip():
        report(spec, "done spec has no 'Definition of done' section")
    elif re.search(r"^- \[ \]", definition, re.M):
        report(spec, "done spec has an unticked box in 'Definition of done'")


def check_specs() -> None:
    features = DOCS / "features"
    index_text = (features / "README.md").read_text()
    indexed = {
        match.group(1): (match.group(2), match.group(3), match.group(4).strip())
        for match in re.finditer(r"^\| \[\d+\]\(([^)]+)\) \|[^|]*\| (\w+) \| ([\w-]+) \| ([^|]+) \|", index_text, re.M)
    }
    for spec in sorted(features.glob("[0-9][0-9][0-9]-*.md")):
        text = spec.read_text()
        status = read_status(text)
        level_match = re.search(r"\*\*Level:\*\*\s*(\w+)", text)
        level = level_match.group(1) if level_match else None
        if status not in SPEC_STATUSES:
            report(spec, f"invalid spec status: {status}")
        if level not in SPEC_LEVELS:
            report(spec, f"missing or invalid Level (full | lite): {level}")
        if status in {"ready", "in-progress", "done"} and re.search(r"^- \[ \]", section(text, "Open questions"), re.M):
            report(spec, f"status is {status} but 'Open questions' still has unanswered items")
        if not re.search(r"\*\*Roadmap:\*\*", text):
            report(spec, "missing the Roadmap field (phase N part NN, or none)")
        roadmap_match = re.search(r"\*\*Roadmap:\*\*\s*phase (\d+[a-z]?) part (\d+)", text)
        roadmap_value = f"phase {roadmap_match.group(1)} part {roadmap_match.group(2)}" if roadmap_match else "none"
        is_retro = "retro-spec" in text.split("\n## ")[0]
        entry = indexed.get(spec.name)
        if entry is None:
            report(features / "README.md", f"spec {spec.name} is missing from the index")
        elif entry != (level, status, roadmap_value):
            report(features / "README.md", f"index says {entry} for {spec.name}, the spec says {(level, status, roadmap_value)}")
        if status == "done" and not is_retro:
            check_done_spec(spec, text)
        if roadmap_match:
            phase, part = roadmap_match.groups()
            if not list((DOCS / "roadmap").glob(f"phase-{phase}-*/{int(part):02d}-*.md")):
                report(spec, f"Roadmap points to a missing part: phase {phase} part {part}")


def main() -> int:
    for path in sorted(DOCS.rglob("*.md")):
        if "tools" in path.relative_to(DOCS).parts:
            continue
        text = path.read_text()
        check_header(path, text.split("\n")[:5])
        if not path.name.startswith("_template"):
            check_links(path, text)
    check_roadmap()
    check_specs()
    if problems:
        print(f"{len(problems)} problem(s) in the docs:")
        for problem in problems:
            print(f"  - {problem}")
        return 1
    print("docs ok")
    return 0


if __name__ == "__main__":
    sys.exit(main())
