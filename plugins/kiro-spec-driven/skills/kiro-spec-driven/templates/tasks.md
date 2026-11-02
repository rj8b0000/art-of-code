# Implementation Plan: <feature-name>

## Overview

<Two to four sentences: the order of work (for example bottom-up: data, services, API, wiring, removal, tests) and how each task ends wired into the running system so nothing is orphaned. Name the implementation language and test framework taken from the design.>

Tasks marked with `*` are optional test tasks and can be skipped for a faster MVP.

## Tasks

- [ ] 1. <Parent task title>
  - [ ] 1.1 <Sub-task title>
    - <Detail bullet: file, change, and constraint.>
    - _Requirements: 1.1, 1.2_
  - [ ] 1.2 <Sub-task title>
    - <Detail bullet.>
    - _Requirements: 1.3_
  - [ ]* 1.3 Write property test for <behavior>
    - **Property 1: <Short title>**
    - **Validates: Requirements 1.1, 1.3**

- [ ] 2. Checkpoint - Ensure all tests pass
  - Run the build and the affected tests; ask the user if questions arise.

- [ ] 3. <Parent task title>
  - [ ] 3.1 <Sub-task title>
    - <Detail bullet.>
    - _Requirements: 2.1_

## Notes

- <Ordering constraint, risk, or deliberately deferred item.>

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["3.1"] }
  ]
}
```
