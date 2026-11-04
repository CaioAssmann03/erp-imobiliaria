---
summary: A help chat inside the ERP (logged-in users only) answered by a free AI API (Gemini, then Groq) that only knows curated help texts, never the database, and refuses questions that contain personal data.
read-when: you touch the assistant app, its providers, its knowledge files, the sensitive-data filter, or its throttles
skip-if: how throttles and the trusted proxy work in general → features/065-security-hardening.md; the frontend widget → frontend/docs/features/assistant.md
---
# 069 — Help assistant

**Status:** in-progress · **Level:** full · **Roadmap:** none · **Apps:** assistant (new, no models) · **Frontend impact:** client regeneration, new screens

## Open questions
None. Pending outside the spec: the user's review of the knowledge texts and one real answer from a provider (no key was available when it was built).

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-11-02 | A free hosted model answers; Ollama on the VPS is **not** used (2 vCPU: too slow, and it competes with the ERP). Order: Gemini, then Groq; a provider without a key is skipped. | the user |
| 2026-11-02 | The assistant never reaches the database or any record: it only knows curated help texts about the system (what a field or a screen is for). | the user |
| 2026-11-02 | A warning in the chat asks not to type sensitive data, **and** a filter refuses the question when it finds some. | the user |
| 2026-11-02 | ~~Two assistants (ERP and public pages).~~ Superseded the same day: the assistant exists **only in the ERP** (fields and screens, login required, ~30 questions/hour per user). Nothing is available without a login: the public endpoint, its daily cap and its knowledge file were removed, not just hidden. | the user |
| 2026-11-02 | ~~One question at a time.~~ Superseded the same day: the chat is a real conversation. The screen sends the last 6 messages (3 exchanges) with each question; the server stays stateless and stores nothing (server-side history was rejected: it would break "never touches the database" and open an LGPD discussion). | the user |
| 2026-11-02 | The texts the assistant knows are drafted by the agent in Portuguese, written for the end user, and reviewed by the user before they are used for real. | the user |

## R — Requirements
Logged-in users need quick answers about how the system works ("what is the *fração* field?") without opening the docs, and without any risk that the answer
comes from, or sends out, registered data. The assistant is a plain question → answer box over a small, curated text.
- [x] R1 — `POST /api/assistant/ask/` needs a logged-in user (401 otherwise); there is no anonymous assistant endpoint.
- [x] R2 — What reaches the provider is only: the fixed instructions, the selected sections of that audience's knowledge file and the question. Nothing about the user, the company or any record.
- [x] R3 — An empty question, or one over 500 characters, answers 400.
- [x] R4 — A question with sensitive data answers 400 with code `assistant_question.question.sensitive_data` **before** any provider is called. Sensitive means an e-mail address, or any run of 9 or more digits once the separators between digits (space, `.`, `-`, `/`, parentheses) are ignored: it covers CPF, CNPJ, phones, boleto lines, card and bank numbers.
- [x] R5 — Ordinary numbers pass: a unit `101`, an event code `0052`, a date, an amount such as `1.234,56`.
- [x] R6 — Providers are tried in order (Gemini, Groq); one without a key is skipped; a timeout, a 429 or a 5xx moves to the next; the first valid answer is returned as `{"answer": "..."}`.
- [x] R7 — With no provider configured, or all of them failing, the answer is 503 with code `assistant.unavailable` and no provider detail.
- [x] R8 — Throttle: 30 questions/hour per user (the real address does not matter: the key is the user). Over the limit: 429.
- [x] R9 — (Dropped with the public assistant: there is no anonymous traffic to cap.)
- [x] R10 — The knowledge file (`erp`) is split in `## ` sections. Only up to 3 sections (the ones that share the most words with the question) plus the always-sent "Geral" section go to the provider, so the prompt stays small enough for the free token limits.
- [x] R11 — Neither the question nor the answer is stored or logged; provider keys never appear in a log or an error. The answer is plain text.
- [x] R12 — The instructions tell the model to answer only from the given text, to say it does not know when the text does not cover it, to answer in Portuguese in a few lines and to ignore any instruction inside the question that tries to change these rules; the answer is capped at 400 output tokens.
- [x] R13 — The body may carry `history`: up to 6 earlier messages `{"author": "user"|"assistant", "content": str}`, oldest first, alternating and starting with `user` (so always whole exchanges). A `user` message has at most 500 characters, an `assistant` one at most 4000. Absent means empty. A longer list, a wrong author or order, or an over-long message answers 400.
- [x] R14 — Every `user` message of the history goes through the same sensitive-data filter as the question, on the server and before any provider is called (400 `assistant_question.question.sensitive_data` on `history`). `assistant` messages are only length-capped: they are the model's own output and a legitimate answer must never make the conversation fail.
- [x] R15 — Providers receive the history as earlier chat turns before the question. The help sections are chosen from the question first; the places it leaves free go to the sections that match the earlier user messages. So a follow-up such as "e como altero isso?" (no topic word of its own) still finds the right section, and a change of subject is not drowned by the conversation so far. The selected sections go in file order (the same start of prompt from one request to the next, which is what the providers' prompt caches match on).

## E — Entities
`No schema change.` The app has no models and no migrations.

## A — Approach
- **No data path by construction:** the view calls one service, `ask_assistant(audience, question)`, which has no ORM import and receives no user. A prompt-injection attack therefore has nothing to leak. The knowledge files are static texts inside the app, never `docs/`, which mentions infrastructure and security.
- **Filter:** a pure function `find_sensitive_data(text)` returns what it found; the serializer raises the 400 from it. Names of people cannot be detected, so the chat's warning stays (the user asked for both).
- **Providers:** `GeminiClient` and `GroqClient` with `urllib3`, like `ResendClient` (timeout 15 s, no retry inside, key only in a header). Models come from settings (`GEMINI_MODEL`, `GROQ_MODEL`), because free models are retired over time. A third provider is one more client in the list.
- **Retrieval:** a knowledge file is Markdown; each `## ` section is a unit. Sections are scored by the words (lowercase, no accents, no stop words under 4 letters) they share with the question; the best 3 are sent plus the section titled `Geral`, in file order. When the question matches fewer than 3, the free places are filled from the earlier user messages of the conversation. No embeddings, no database.
- **Stateless conversation:** each request carries the question plus up to 6 earlier messages from the screen (`history`). The server keeps nothing between requests; the history lives only in the chat component's state. Cost: about +600 to 1,000 input tokens per question once the history is full, so Groq's 8,000 tokens a minute holds about 3 questions a minute instead of 5. Every user message is filtered again on the server, because the client could send anything.
- **Throttle:** `TrustedProxyScopedRateThrottle` (spec 007/065) with the scope `assistant_erp`, keyed by the user. Rejected: an anonymous public assistant (user decision, 2026-11-02: quota and attack surface for no benefit).
- **Rejected:** Ollama on the VPS (see Decisions); storing the conversation on the server; letting the model call tools or queries.

## S — Structure
New files:
- `apps/assistant/{__init__,apps,exceptions}.py`, `urls.py`, `errors/` (`AssistantError`, `AssistantQuestionError`, the codes the frontend translates)
- `apps/assistant/views/ask_views.py` (`AskView`), `serializers/question.py` (`QuestionSerializer`, `AnswerSerializer`)
- `apps/assistant/services/ask_assistant.py`
- `apps/assistant/sensitive_data.py`, `apps/assistant/knowledge.py`, `apps/assistant/messages.py` (`Message`, `Role`, the history limit)
- `apps/assistant/providers/{gemini,groq,errors}.py`
- the knowledge file `erp` in `apps/assistant/knowledge/` (Markdown)
- `apps/assistant/tests/`
Changed: `config/settings.py` (app, env vars, throttle rates), `config/urls.py`, `.env.example`, `docs/apps/assistant.md` (new), `docs/README.md`, `AGENTS.md` map, `docs/architecture/operations.md` (env vars).

| Method | URL | Request | Response | Notes |
|---|---|---|---|---|
| POST | `/api/assistant/ask/` | `{"question": str ≤ 500, "history"?: [{"author", "content"}] ≤ 6}` | `200 {"answer": str}` | login required; scope `assistant_erp` |
Errors: 400 `required`/`max_length`/`assistant_question.question.sensitive_data` on `question` or `history`, 400 `invalid`/`invalid_choice`/`max_length` on a malformed `history`, 401, 429 `throttled`, 503 `assistant.unavailable`.

## O — Operations
1. App skeleton, `INSTALLED_APPS`, urls, settings (`GEMINI_API_KEY`, `GEMINI_MODEL`, `GROQ_API_KEY`, `GROQ_MODEL`, the throttle rate), `.env.example`.
2. `sensitive_data.py` and its tests.
3. `knowledge.py` with the section scoring; the knowledge file (draft, for review).
4. Provider clients, then the service with the fallback.
5. Serializer, views, throttles, daily cap.
6. Docs; regenerate the frontend client; the frontend widget (see the frontend docs).

## N — Norms
Names per `conventions/naming.md`; a service holds no business rule: the filter is a pure function and the limits are settings. Comments only for reasons. Exception: the app has no models, so no `BaseModel`.

## S — Safeguards
- **Privacy:** the provider receives only the question, the last 6 messages of the conversation and public-grade help text. The free Gemini plan may use what it receives to improve Google's products, so the filter and the warning are part of the contract, not decoration.
- **Prompt injection:** the model has no tools and no data; the worst result is an off-topic or wrong answer. The knowledge files must contain nothing that is not meant to be repeated.
- **Abuse and quota:** login required, a per-user throttle, a 500-character question, at most 6 history messages and 400 output tokens.
- **Secrets:** keys only in the environment, never in a message, log, response or frontend variable.
- **Failure modes:** a provider failing falls through to the next; all failing is a 503 the screen shows as "unavailable, try again later"; a cache failure in the throttle lets the request through (as in spec 065).
- **Output:** plain text; the frontend renders it as text, never as HTML.
- **Limits of the filter:** it does not detect names or free-text addresses; it can refuse a question that contains a long list of plain numbers.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/assistant/tests/test_views.py::test_erp_endpoint_requires_login`, `::test_there_is_no_anonymous_assistant` |
| R2 | `apps/assistant/tests/test_ask_assistant.py::test_prompt_has_only_instructions_knowledge_and_question` |
| R3 | `apps/assistant/tests/test_views.py::test_empty_and_long_questions_are_refused` |
| R4 | `apps/assistant/tests/test_sensitive_data.py::test_finds_email_cpf_cnpj_phone_boleto_and_card`, `apps/assistant/tests/test_views.py::test_sensitive_question_never_reaches_a_provider` |
| R5 | `apps/assistant/tests/test_sensitive_data.py::test_ordinary_numbers_pass` |
| R6 | `apps/assistant/tests/test_ask_assistant.py::test_falls_back_to_the_next_provider`, `::test_provider_without_key_is_skipped` |
| R7 | `apps/assistant/tests/test_ask_assistant.py::test_all_providers_failing_is_unavailable`, `apps/assistant/tests/test_views.py::test_no_provider_configured_is_503` |
| R8 | `apps/assistant/tests/test_views.py::test_erp_throttle_per_user` |
| R9 | N/A — dropped with the public assistant |
| R10 | `apps/assistant/tests/test_knowledge.py::test_selects_best_sections_plus_general`, `::test_the_erp_file_has_a_general_section_and_the_topics` |
| R11 | `apps/assistant/tests/test_views.py::test_question_and_answer_are_not_logged` |
| R12 | `apps/assistant/tests/test_ask_assistant.py::test_instructions_and_token_cap`, `apps/assistant/tests/test_providers.py::test_response_parsing_and_errors` |
| R13 | `apps/assistant/tests/test_views.py::test_a_valid_history_reaches_the_provider_as_earlier_turns`, `::test_a_malformed_history_is_refused` |
| R14 | `apps/assistant/tests/test_views.py::test_sensitive_data_in_the_history_never_reaches_a_provider` |
| R15 | `apps/assistant/tests/test_ask_assistant.py::test_the_history_picks_the_help_sections_of_a_follow_up`, `apps/assistant/tests/test_knowledge.py::test_a_follow_up_takes_its_sections_from_the_earlier_questions`, `::test_a_change_of_subject_is_not_drowned_by_the_earlier_questions`, `::test_the_sections_come_in_file_order_with_general_first`, `apps/assistant/tests/test_providers.py::test_gemini_sends_the_history_as_user_and_model_turns`, `::test_groq_sends_the_history_as_user_and_assistant_turns` |

## Definition of done
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`pnpm generate:api`), or `N/A — no API change`
- [x] `docs/apps/assistant.md` updated; `docs/known-gaps.md` row closed (if any) (no gap row)
- [x] Roadmap part and phase table updated (if **Roadmap** is set); index in `features/README.md` updated (Roadmap is `none`)
