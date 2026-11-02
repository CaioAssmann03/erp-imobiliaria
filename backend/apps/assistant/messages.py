"""One message of the conversation the screen sends along with a question (spec 069, R13)."""

from dataclasses import dataclass
from enum import StrEnum

MAXIMUM_HISTORY_MESSAGES = 6
MAXIMUM_QUESTION_LENGTH = 500
MAXIMUM_ANSWER_LENGTH = 4000


class Author(StrEnum):
    USER = "user"
    ASSISTANT = "assistant"


@dataclass(frozen=True)
class Message:
    author: Author
    text: str
