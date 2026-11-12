---
summary: The help assistant (spec 069): a question (plus the last 6 messages of the conversation) → answer endpoint, for logged-in users only, over a curated text, the Gemini → Groq fallback, the sensitive-data filter, the limits and the knowledge files.
read-when: you touch the assistant endpoints, its providers, its knowledge texts, the personal-data filter or its throttles
skip-if: throttles and the trusted proxy in general → features/065-security-hardening.md; the chat widget → frontend/docs/features/assistant.md; personal data and LGPD policy → architecture/quality.md
---
# App `assistant`

A help chat inside the ERP. It does **not** exist for visitors: there is no anonymous endpoint. No models, no migrations. **It never touches the database or any record**: the service has no ORM import and receives no user; what reaches a provider is the fixed instructions, the selected help sections, the earlier messages the screen sends and the question.

## Endpoints
| Method | URL | Who | Limit |
|---|---|---|---|
| POST | `/api/assistant/ask/` | a logged-in user | 30/hour per user (`assistant_erp`) |

Body `{"question": str ≤ 500, "history": [{"author": "user"|"assistant", "content": str}] ≤ 6}` (`history` optional); answer `{"answer": str}`, plain text. Errors: 400 (`blank`, `max_length`, `invalid`, `invalid_choice`, `assistant_question.question.sensitive_data`), 401, 429 `throttled`, 503 `assistant.unavailable` (no provider configured or all failing; it never says which).

## Rules worth knowing
- **History** (`messages.py`, `serializers/question.py`): up to 6 earlier messages, whole exchanges only (user, assistant, user, assistant…, oldest first); a user message ≤ 500 characters, an assistant one ≤ 4000. The server stays stateless: the screen keeps the conversation and sends it each time. Providers get it as earlier chat turns (Gemini `user`/`model`, Groq `user`/`assistant`) and the help sections are chosen from the question first, with the places it leaves free filled from the earlier user messages (so a follow-up finds the topic of the first question and a change of subject is not drowned by it). They go in file order, so the start of the prompt repeats from one request to the next.
- **Filter** (`sensitive_data.py`): refuses an e-mail address and any run of 9 or more digits once the separators between digits (`. - / ( )` and a space before a group of 3+ digits) are ignored: CPF, CNPJ, phones, boleto lines, cards. Dates, times, amounts, units and event codes pass. Names cannot be detected: the chat shows a warning. A refused question spends no quota. The same filter runs on every **user** message of the history (the client could send anything); assistant messages are only length-capped, so a legitimate answer never breaks the conversation.
- **Providers** (`providers/`): Gemini then Groq with `urllib3`; one without a key is skipped, a timeout, 429, 5xx or bad body falls to the next, all failing is a 503. Models come from `GEMINI_MODEL` and `GROQ_MODEL`; keys from `GEMINI_API_KEY` and `GROQ_API_KEY`, only in the environment. Output capped at 400 tokens (the `gpt-oss` models on Groq are asked for low reasoning, because their thinking tokens count against that cap).
- **Knowledge** (`knowledge/erp.md`; `knowledge.py`): one curated Markdown file for end users, **never** the repository `docs/` (infrastructure and security). Each `## ` section is a unit; the `Geral` section always goes and the 3 sections that share the most words with the question (then with the earlier questions, if places are left) join it, in file order, so the prompt fits the free token limits. A new topic is a new `## ` section.
- **Nothing is stored or logged**: no question, no answer; a failing provider logs only its name and `HTTP 429`-like text.
- The server receives the last 6 messages with each question and stores nothing: no conversation, no history table.

## Cost per question (measured 2026-11-02)
About **1,100 input tokens** without history (the instructions, `Geral` and up to 3 sections: 3.3k–4.3k characters), about 600–1,000 more with a full history (estimate, not measured), plus 80–360 of output: Gemini counted 1,053 in and 76 out, Groq 1,084 in and 138–361 out. Real limits seen on the Groq key: 1,000 requests a day and **8,000 tokens a minute**, so Groq (the fallback) holds about 5 questions a minute without history and about 3 with a full one. The Gemini limits are in AI Studio's *Rate limits* page. The app's own cap is 30 questions an hour per user.

## Prompt caching (measured 2026-11-02, four chained questions per run)
- **Groq (`openai/gpt-oss-120b`)** caches automatically (prefix match, in blocks of 128 tokens; `usage.prompt_tokens_details.cached_tokens`): prompts of 1,090–1,350 tokens had 256–1,024 of them cached in 9 of 12 requests, against 3 of 16 before the sections went in file order. Part of that is inflated by repeating the same test conversation; expect less in real use. Cached tokens do not count against the per-minute limit.
- **Gemini (`gemini-2.5-flash`)** caches implicitly but only above **2,048 tokens**; our prompts (1,050–1,300) never reach it (`cachedContentTokenCount` was always 0), so there is nothing to tune. Its free plan answered 429 after about 25 requests in a few minutes, so under load Groq carries the traffic.
- The history limit barely moves the cost (6 vs 4 messages: about 70 tokens on the 4th question); it stays at 6.

## Operations
Without any key the endpoints answer 503 (the chat shows "indisponível"). Create the keys in Google AI Studio and the Groq console; free plans have daily and per-minute limits and the Gemini free plan may use the content to improve Google's products, hence the filter. Models change over time: if one is retired, change the variable, not the code.
