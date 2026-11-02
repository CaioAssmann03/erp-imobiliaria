"""The texts the assistant knows (spec 069, R10): one curated Markdown file per audience, never the repository docs."""

import math
import re
import unicodedata
from dataclasses import dataclass
from enum import StrEnum
from functools import lru_cache
from pathlib import Path

KNOWLEDGE_DIRECTORY = Path(__file__).resolve().parent / "knowledge"
GENERAL_TITLE = "Geral"
MAXIMUM_SECTIONS = 3
MINIMUM_WORD_LENGTH = 4
TITLE_WORD_WEIGHT = 3
STOP_WORDS = frozenset(
    {"para", "como", "qual", "quais", "esse", "essa", "este", "esta", "isso", "pode", "posso", "sistema", "quando", "onde", "tela", "campo"}
)
SECTION_HEADING = re.compile(r"^## (.+)$", re.MULTILINE)
WORD = re.compile(r"[a-z0-9]+")


class Audience(StrEnum):
    ERP = "erp"


@dataclass(frozen=True)
class Section:
    title: str
    body: str


def significant_words(text: str) -> set[str]:
    """Lowercase words without accents or a final plural `s`, so "unidades" matches "unidade"."""
    plain = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().lower()
    words = (word.removesuffix("s") if len(word) > MINIMUM_WORD_LENGTH else word for word in WORD.findall(plain))
    return {word for word in words if len(word) >= MINIMUM_WORD_LENGTH and word not in STOP_WORDS}


@lru_cache
def load_sections(audience: Audience) -> tuple[Section, ...]:
    text = (KNOWLEDGE_DIRECTORY / f"{audience.value}.md").read_text(encoding="utf-8")
    headings = list(SECTION_HEADING.finditer(text))
    return tuple(
        Section(
            title=heading.group(1).strip(),
            body=text[heading.end() : headings[position + 1].start() if position + 1 < len(headings) else len(text)].strip(),
        )
        for position, heading in enumerate(headings)
    )


@lru_cache
def word_rarity(audience: Audience) -> dict[str, float]:
    """How much a word says: the log of (sections / sections that have it), so "hidrometro" outweighs "unidade", which is everywhere."""
    sections = load_sections(audience)
    sections_with_word: dict[str, int] = {}
    for section in sections:
        for word in significant_words(f"{section.title} {section.body}"):
            sections_with_word[word] = sections_with_word.get(word, 0) + 1
    return {word: math.log(len(sections) / count) + 1 for word, count in sections_with_word.items()}


def score(audience: Audience, section: Section, question_words: set[str]) -> float:
    rarity = word_rarity(audience)
    title_words = significant_words(section.title)
    body_words = significant_words(section.body)
    return sum(
        rarity.get(word, 0) * (TITLE_WORD_WEIGHT if word in title_words else 1)
        for word in question_words
        if word in title_words or word in body_words
    )


def best_matches(audience: Audience, sections: list[Section], text: str) -> list[Section]:
    """The sections that share at least one significant word with `text`, best first, at most `MAXIMUM_SECTIONS`."""
    words = significant_words(text)
    scores = {section.title: score(audience, section, words) for section in sections}
    ranked = sorted(sections, key=lambda section: scores[section.title], reverse=True)
    return [section for section in ranked[:MAXIMUM_SECTIONS] if scores[section.title] > 0]


def select_sections(audience: Audience, question: str, earlier_questions: str = "") -> list[Section]:
    """The `Geral` section plus up to three others, in file order (spec 069, R10, R15).

    The question itself picks first, so a change of subject is not drowned by the conversation so far. The places it leaves free go to the
    earlier user messages: a follow-up such as "e como altero isso?" has no topic word of its own. The file order keeps the start of the
    prompt the same from one request to the next, which is what the providers' prompt caches match on.
    """
    sections = load_sections(audience)
    others = [section for section in sections if section.title != GENERAL_TITLE]
    chosen = best_matches(audience, others, question)
    if earlier_questions and len(chosen) < MAXIMUM_SECTIONS:
        remaining = [section for section in others if section not in chosen]
        chosen += best_matches(audience, remaining, earlier_questions)[: MAXIMUM_SECTIONS - len(chosen)]
    return [section for section in sections if section.title == GENERAL_TITLE or section in chosen]
