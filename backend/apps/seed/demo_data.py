"""The fixed data of the demo: condominiums, names, cost centers, suppliers and payables."""

from dataclasses import dataclass


@dataclass(frozen=True)
class DemoCondominium:
    name: str
    city: str
    state: str
    zip_code: str
    kind: str  # Condominium type: "residential" | "commercial"
    fee_type: str  # "fixed" (value in R$) | "variable" (value in %)
    fee_value: str
    has_address: bool  # False leaves the condominium without an address
    active: bool
    block_names: list[str]
    days_until_adjustment: (
        int | None
    )  # negative = overdue; None = no adjustment base date
    has_wrong_apportionment: bool = False  # fractions sum 0.9 (shows the pendency)
    has_cost_centers: bool = True


DEMO_CONDOMINIUMS = [
    DemoCondominium(
        name="Residencial Jardim das Acácias",
        city="São Paulo",
        state="SP",
        zip_code="01310-100",
        kind="residential",
        fee_type="fixed",
        fee_value="1850.00",
        has_address=True,
        active=True,
        block_names=["A", "B"],
        days_until_adjustment=-20,
    ),
    DemoCondominium(
        name="Edifício Vista Mar",
        city="Santos",
        state="SP",
        zip_code="11060-001",
        kind="residential",
        fee_type="variable",
        fee_value="4.50",
        has_address=True,
        active=True,
        block_names=[],
        days_until_adjustment=18,
    ),
    DemoCondominium(
        name="Condomínio Parque Ibirapuera",
        city="São Paulo",
        state="SP",
        zip_code="04094-050",
        kind="residential",
        fee_type="fixed",
        fee_value="2200.00",
        has_address=True,
        active=True,
        block_names=["Torre 1", "Torre 2"],
        days_until_adjustment=40,
    ),
    DemoCondominium(
        name="Centro Empresarial Paulista",
        city="São Paulo",
        state="SP",
        zip_code="01452-000",
        kind="commercial",
        fee_type="variable",
        fee_value="5.00",
        has_address=True,
        active=True,
        block_names=[],
        days_until_adjustment=75,
    ),
    DemoCondominium(
        name="Edifício Solar dos Ipês",
        city="Campinas",
        state="SP",
        zip_code="13015-100",
        kind="residential",
        fee_type="fixed",
        fee_value="1500.00",
        has_address=False,
        active=True,
        block_names=[],
        days_until_adjustment=110,
        has_wrong_apportionment=True,
        has_cost_centers=False,
    ),
    DemoCondominium(
        name="Residencial Bosque Verde",
        city="Curitiba",
        state="PR",
        zip_code="80010-000",
        kind="residential",
        fee_type="fixed",
        fee_value="1700.00",
        has_address=True,
        active=True,
        block_names=["A"],
        days_until_adjustment=150,
    ),
    DemoCondominium(
        name="Edifício Palácio das Artes",
        city="Belo Horizonte",
        state="MG",
        zip_code="",
        kind="commercial",
        fee_type="fixed",
        fee_value="2600.00",
        has_address=True,
        active=True,
        block_names=[],
        days_until_adjustment=240,
        has_wrong_apportionment=True,
        has_cost_centers=False,
    ),
    DemoCondominium(
        name="Condomínio Recanto do Sol",
        city="Florianópolis",
        state="SC",
        zip_code="88010-400",
        kind="residential",
        fee_type="fixed",
        fee_value="1300.00",
        has_address=True,
        active=False,
        block_names=[],
        days_until_adjustment=None,
    ),
]

STREETS = [
    "Av. Paulista",
    "Rua das Flores",
    "Av. Brasil",
    "Rua Augusta",
    "Rua XV de Novembro",
    "Av. Atlântica",
]
DISTRICTS = [
    "Centro",
    "Jardim América",
    "Vila Nova",
    "Bela Vista",
    "Boa Viagem",
    "Moema",
]

NAMES = [
    "Ana Beatriz Lima",
    "Carlos Eduardo Souza",
    "Mariana Costa Ribeiro",
    "João Pedro Almeida",
    "Fernanda Oliveira Santos",
    "Ricardo Mendes Pereira",
    "Patrícia Gomes Carvalho",
    "Lucas Martins Rocha",
    "Juliana Ferreira Dias",
    "Rafael Barbosa Nunes",
    "Camila Rodrigues Araújo",
    "Bruno Henrique Teixeira",
    "Aline Cardoso Moreira",
    "Thiago Azevedo Ramos",
    "Larissa Nascimento Freitas",
    "Gustavo Correia Pinto",
    "Renata Duarte Machado",
    "Felipe Cavalcanti Lopes",
    "Vanessa Monteiro Batista",
    "Diego Fonseca Campos",
]
COMPANIES = [
    "Construtora Horizonte Ltda",
    "Investimentos Alvorada S.A.",
    "Grupo Pinheiro Participações",
    "Imobiliária Boa Morada Ltda",
    "Holding Santa Clara Ltda",
    "Lojas Aurora Comércio Ltda",
]
UNIT_TYPES = {
    "residential": ["apartment"] * 6 + ["house", "parking_space"],
    "commercial": ["office"] * 4 + ["store", "suite"],
}
UNIT_NUMBERS = range(101, 120)

COST_CENTERS = ["Fundo de Reserva", "Fundo de Obras", "Água e Esgoto"]
# Fornecedores fictícios e o modelo de lançamento de cada sub-conta.
DEMO_SUPPLIERS = [
    "Companhia de Energia Elétrica",
    "Departamento Municipal de Água e Esgoto",
    "Elevadores Atlas Manutenção Ltda",
    "Limpeza Total Serviços Ltda",
]
ENTRY_TEMPLATES = {
    "Fundo de Reserva": "DEPÓSITO FUNDO DE RESERVA",
    "Fundo de Obras": "PG MANUTENÇÃO E OBRAS",
    "Água e Esgoto": "PG ÁGUA E ESGOTO",
}


@dataclass(frozen=True)
class DemoPayable:
    """An open account payable: `condominium_position` is an index of DEMO_CONDOMINIUMS (None = company expense)."""

    description: str
    supplier: str
    amount: str
    days_until_due: int
    condominium_position: int | None
    cost_center: str | None


DEMO_PAYABLES = [
    DemoPayable(
        "Conta de água - setembro", DEMO_SUPPLIERS[1], "1284.50", -5, 0, "Água e Esgoto"
    ),
    DemoPayable(
        "Manutenção dos elevadores",
        DEMO_SUPPLIERS[2],
        "2100.00",
        10,
        0,
        "Fundo de Obras",
    ),
    DemoPayable(
        "Conta de água - setembro", DEMO_SUPPLIERS[1], "960.00", 3, 1, "Água e Esgoto"
    ),
    DemoPayable(
        "Limpeza pós-obra", DEMO_SUPPLIERS[3], "1500.00", 20, 2, "Fundo de Obras"
    ),
    DemoPayable(
        "Energia elétrica - escritório", DEMO_SUPPLIERS[0], "780.35", 7, None, None
    ),
]

# Dias até o fim de cada locação sorteada (negativo = já encerrada).
DAYS_UNTIL_LEASE_END = [-12, 9, 25, 48, 90, None]
