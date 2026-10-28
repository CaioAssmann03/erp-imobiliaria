"""Deterministic CPF and CNPJ generation (valid check digits)."""


def generate_cpf(seed: int) -> str:
    digits = [int(char) for char in f"{100000000 + seed * 7919:09d}"[-9:]]
    for length in (9, 10):
        weighted_sum = sum(
            digit * (length + 1 - position)
            for position, digit in enumerate(digits[:length])
        )
        digits.append((weighted_sum * 10 % 11) % 10)
    return "".join(map(str, digits))


def generate_cnpj(seed: int) -> str:
    digits = [int(char) for char in f"{10000000 + seed * 104729:08d}"[-8:]] + [
        0,
        0,
        0,
        1,
    ]
    for weights in (
        [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
        [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    ):
        weighted_sum = sum(digit * weight for digit, weight in zip(digits, weights))
        remainder = weighted_sum % 11
        digits.append(0 if remainder < 2 else 11 - remainder)
    return "".join(map(str, digits))
