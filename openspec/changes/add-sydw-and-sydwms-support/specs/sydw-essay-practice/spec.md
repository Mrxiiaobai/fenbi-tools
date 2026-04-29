## ADDED Requirements

### Requirement: SYDWMS category SHALL be selectable in Home
The category selector SHALL include `sydwms` as a visible option, and selecting it SHALL refresh menu/history data through the same `pageInit` and `history` message flow.

#### Scenario: User switches to sydwms
- **WHEN** user changes category to `sydwms`
- **THEN** webview posts `changeCategory` and `pageInit` with `categoryId=sydwms`
- **THEN** extension returns refreshed menu/history data for that category context

### Requirement: SYDWMS answers SHALL use essay incr payload
For `sydwms` subjective questions, incremental answer reporting SHALL use essay payload shape (`type=204` and textual `answer`) when calling `combine/exercise/incrUpdate`.

#### Scenario: Submit incremental essay answer for sydwms
- **WHEN** user enters text answer in sydwms question
- **THEN** extension calls incr update with `answer.type=204`
- **THEN** extension sends answer text via `answer.answer`

### Requirement: SYDWMS submit flow SHALL reuse essay-compatible solution pipeline
The system SHALL allow `sydwms` practice submission and solution retrieval through existing combine endpoints, preserving `routecs=sydwms` in all related requests.

#### Scenario: Submit sydwms practice
- **WHEN** user submits a sydwms practice
- **THEN** extension calls submit and solution endpoints with `routecs=sydwms`
- **THEN** webview receives a `solution` message with merged user answers
