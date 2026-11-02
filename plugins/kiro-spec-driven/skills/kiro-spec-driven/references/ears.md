# EARS notation

EARS (Easy Approach to Requirements Syntax) keeps acceptance criteria unambiguous and testable. Use uppercase keywords and a glossary term as the subject (`THE Invoice_Endpoint`), so a criterion reads as a test case.

| Pattern | Template | Example |
|---|---|---|
| Ubiquitous | THE `<System>` SHALL `<response>` | THE Password_Store SHALL encrypt all stored passwords. |
| Event-driven | WHEN `<trigger>`, THE `<System>` SHALL `<response>` | WHEN the user submits an empty form, THE Form_Validator SHALL display a validation error. |
| State-driven | WHILE `<state>`, THE `<System>` SHALL `<response>` | WHILE an upload is in progress, THE Upload_Form SHALL disable the submit button. |
| Unwanted behavior | IF `<condition>`, THEN THE `<System>` SHALL `<response>` | IF the request body is not valid JSON, THEN THE Endpoint SHALL return HTTP 400 and SHALL NOT persist anything. |
| Optional feature | WHERE `<feature is enabled>`, THE `<System>` SHALL `<response>` | WHERE dark mode is enabled, THE Settings_Store SHALL persist the preference across sessions. |

Combine templates when a criterion has more than one condition: `WHILE offline, WHEN the user taps save, THE Editor SHALL queue the change.`

## Writing good criteria

- One behavior per criterion; split compound sentences.
- Specific enough to check: name the status code, field, limit or state, not "handle errors gracefully".
- Every `IF ... THEN` failure case gets its own criterion, and often a matching error-handling entry in the design.
- Round-trip and invariant behaviors (parse then serialize returns the original) are ordinary criteria and become Correctness Properties in the design.
- Number criteria per requirement (`1.`, `2.`); tasks cite them as `_Requirements: 1.2, 3.1_`.
