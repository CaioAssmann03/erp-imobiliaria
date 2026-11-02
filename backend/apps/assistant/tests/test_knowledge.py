import pytest

from apps.assistant.knowledge import (
    GENERAL_TITLE,
    MAXIMUM_SECTIONS,
    Audience,
    load_sections,
    select_sections,
    significant_words,
)


def test_selects_best_sections_plus_general() -> None:
    sections = select_sections(Audience.ERP, "O que é a fração ideal e o critério de rateio das unidades?")

    titles = [section.title for section in sections]
    assert titles[0] == GENERAL_TITLE
    assert "Critérios de rateio e frações ideais" in titles
    assert len(titles) <= MAXIMUM_SECTIONS + 1


def test_a_rare_word_outweighs_common_ones_in_a_two_topic_question() -> None:
    titles = [section.title for section in select_sections(Audience.ERP, "O que é o campo Gás (R$) na unidade e o que é hidrômetro?")]

    assert "Unidades" in titles
    assert "Condomínio: Identificação e endereço" in titles


def test_an_unrelated_question_gets_only_the_general_section() -> None:
    sections = select_sections(Audience.ERP, "xyzzy plugh")

    assert [section.title for section in sections] == [GENERAL_TITLE]


def test_the_erp_file_has_a_general_section_and_the_topics() -> None:
    titles = {section.title for section in load_sections(Audience.ERP)}

    assert GENERAL_TITLE in titles
    assert {"Unidades", "Documentos (boletos emitidos)"} <= titles


@pytest.mark.parametrize("audience", list(Audience))
def test_a_knowledge_file_has_no_secret_looking_text(audience: Audience) -> None:
    text = " ".join(section.body for section in load_sections(audience)).lower()

    for forbidden in ("password", "senha de", "api_key", "secret", "token"):
        assert forbidden not in text


def test_words_lose_accents_and_plurals() -> None:
    assert significant_words("Unidades") == {"unidade"}
    assert significant_words("fração") == {"fracao"}
    assert significant_words("o que é isso para você") == {"voce"}


def titles(question: str, earlier_questions: str = "") -> list[str]:
    return [section.title for section in select_sections(Audience.ERP, question, earlier_questions)]


def test_a_follow_up_takes_its_sections_from_the_earlier_questions() -> None:
    assert "Critérios de rateio e frações ideais" not in titles("E como altero isso?")
    assert "Critérios de rateio e frações ideais" in titles("E como altero isso?", "O que é a fração ideal?")


def test_a_change_of_subject_is_not_drowned_by_the_earlier_questions() -> None:
    """The question's own topic wins; the earlier questions only fill the places left."""
    earlier = "O que é a fração ideal? Isso afeta o rateio das despesas?"

    assert "Unidades" in titles("O que é uma unidade?", earlier)
    assert "Unidades" in titles("O que é uma unidade?")


def test_the_sections_come_in_file_order_with_general_first() -> None:
    selected = titles("O que é a fração ideal e o critério de rateio das unidades?")
    order = [section.title for section in load_sections(Audience.ERP)]

    assert selected == sorted(selected, key=order.index)
    assert selected[0] == GENERAL_TITLE
