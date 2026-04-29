## ADDED Requirements

### Requirement: Category routing SHALL be centrally mapped
The system SHALL define a centralized mapping from category to routing metadata (`courseSetPrefix`, `routecs`, `tikuPrefix`, answerMode) and SHALL use this mapping in service calls and event handlers.

#### Scenario: Resolve routing metadata for category
- **WHEN** extension handles any action requiring category routing (init, changeCategory, studyTime, incr, submit)
- **THEN** it reads routing metadata from the centralized mapping
- **THEN** it does not rely on scattered hard-coded category conditionals

### Requirement: Course set change SHALL use mapped courseSetPrefix
On category switch, the system SHALL call `activity/userquiz/courseSetChange` with the mapped `courseSetPrefix` rather than raw UI value when they differ.

#### Scenario: Switch from xingce to sydwms
- **WHEN** user selects `sydwms`
- **THEN** extension resolves mapped courseSetPrefix for `sydwms`
- **THEN** extension calls `courseSetChange` with that mapped prefix before or during init refresh

### Requirement: Study time reporting SHALL use mapped tikuPrefix
The study time report (`activity/report/studyTime`) SHALL use category-derived `tikuPrefix` from centralized routing metadata for all supported categories.

#### Scenario: Report study time in sydw practice
- **WHEN** user answers sydw question and study time is reported
- **THEN** payload contains `tikuPrefix` resolved from category mapping
- **THEN** payload category prefix is consistent with exercise routecs
