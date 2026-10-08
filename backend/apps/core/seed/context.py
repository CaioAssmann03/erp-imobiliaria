"""What every seed step shares."""

import random
from dataclasses import dataclass
from datetime import date

from typing_extensions import final

from apps.core.models import Company
from apps.persons.models import Person


@final
@dataclass(frozen=True)
class SeedContext:
    random_generator: random.Random
    company: Company
    active_persons: list[Person]
    today: date
