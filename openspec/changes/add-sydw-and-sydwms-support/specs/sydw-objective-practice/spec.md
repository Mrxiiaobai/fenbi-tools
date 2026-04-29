## ADDED Requirements

### Requirement: SYDW labels SHALL be loaded from comptroller subLabels
The system SHALL request `GET /api/sydw/comptroller/subLabels` when the selected category is `sydw`, and SHALL transform the response list (`id`, `name`, `childrenLabels`) into the tree structure consumed by the Home menu.

#### Scenario: Initialize sydw menu
- **WHEN** user enters Home page with category set to `sydw`
- **THEN** extension requests `/api/sydw/comptroller/subLabels`
- **THEN** webview receives an `init` message whose `menu` can render as a selectable tree

### Requirement: SYDW practice selection SHALL resolve to a combine key
When a user selects a sydw专项节点, the system SHALL obtain a practice key that can be used by the existing exercise loading flow (`getExercise` + static question fetch), either from cache or by requesting a new exercise session.

#### Scenario: Start sydw practice from tree node
- **WHEN** user clicks a sydw tree node
- **THEN** extension resolves a valid `combineKey`
- **THEN** extension sends `getQuestion` response with questions and that `combineKey`

### Requirement: SYDW objective answers SHALL use objective incr payload
For `sydw` objective questions, incremental answer reporting SHALL use the objective payload shape (`type=201` and `choice` value) to `combine/exercise/incrUpdate`.

#### Scenario: Submit incremental objective answer for sydw
- **WHEN** user selects an option in sydw objective question
- **THEN** extension calls incr update with `answer.type=201`
- **THEN** extension sends selected option via `answer.choice`

### Requirement: SYDW objective flow SHALL support submit and solution retrieval
After user submits a sydw practice, the system SHALL call submit endpoint and SHALL fetch solution static data, including merged `userAnswer` and correctness summary.

#### Scenario: Submit sydw objective practice
- **WHEN** user taps submit in a sydw practice
- **THEN** extension calls `combine/exercise/submit` with `routecs=sydw`
- **THEN** extension fetches solution details and posts `solution` message with `correctCount` and `questionCount`
