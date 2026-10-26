"""Dados de exemplo para visualizar o sistema: `seed_demo` cria, `seed_demo --clear` remove.

Idempotente: rodar de novo não duplica. Só mexe nos registros criados por este comando
(identificados por nome de condomínio e por CPF/CNPJ gerados de forma determinística).
A lógica está em `apps/seed/`; aqui ficam só os argumentos e a ordem dos passos.
"""

import random
from typing import Any, override

from django.core.management.base import BaseCommand, CommandParser
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from apps.condominiums.models import Address, Condominium
from apps.core.models import Company
from apps.seed.condominiums import (
    create_demo_condominiums,
    finalize_demo_condominiums,
)
from apps.seed.context import SeedContext
from apps.seed.demo_data import DEMO_CONDOMINIUMS
from apps.seed.finance import clear_demo_finance, create_demo_finance
from apps.seed.persons import create_persons, demo_person_definitions
from apps.persons.models import Person


class Command(BaseCommand):
    help = "Cria (ou remove, com --clear) dados de exemplo: condomínios, unidades, pessoas, vínculos e o financeiro (fornecedores, modelos e contas a pagar)."

    @override
    def add_arguments(self, parser: CommandParser) -> None:
        _ = parser.add_argument(
            "--clear", action="store_true", help="Remove os dados de exemplo."
        )

    @override
    @transaction.atomic
    def handle(self, *args: Any, **options: Any) -> None:
        if options["clear"]:
            self._clear()
            return
        self._create()

    def _clear(self) -> None:
        demo_names = [demo.name for demo in DEMO_CONDOMINIUMS]
        condominiums = Condominium.objects.filter(name__in=demo_names)
        clear_demo_finance(condominiums)
        # Address é OneToOne com SET_NULL: apagar o condomínio deixaria o endereço órfão.
        _ = Address.objects.filter(condominium__in=condominiums).delete()
        condos, _ = condominiums.delete()
        documents = [definition[2] for definition in demo_person_definitions()]
        persons, _ = Person.objects.filter(
            Q(people_individual__cpf__in=documents) | Q(people_legal__cnpj__in=documents)
        ).delete()
        self.stdout.write(
            self.style.SUCCESS(
                f"Removidos: {condos} registros de condomínios (com unidades/vínculos) e {persons} de pessoas."
            )
        )

    def _create(self) -> None:
        company = Company.objects.first()
        if company is None:
            _ = self.stderr.write("Nenhuma Company cadastrada; crie uma antes.")
            return

        random_generator = random.Random(42)
        persons = create_persons(company, random_generator)
        context = SeedContext(
            random_generator=random_generator,
            company=company,
            active_persons=[person for person in persons if person.active] or persons,
            today=timezone.localdate(),
        )
        units_created, links_created = create_demo_condominiums(context)
        finalize_demo_condominiums(random_generator)
        create_demo_finance(context)
        self._report(len(persons), units_created, links_created)

    def _report(self, persons_count: int, units_created: int, links_created: int) -> None:
        self.stdout.write(
            self.style.SUCCESS(
                f"Dados de exemplo prontos: {persons_count} pessoas, {len(DEMO_CONDOMINIUMS)} condomínios, "
                f"{units_created} unidades e {links_created} vínculos."
            )
        )
