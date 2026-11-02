# Design Document

## Overview

<The chosen approach in a few sentences and why it fits the existing codebase.>

### Key design decisions and rationale

- **<Decision>**: <Why this over the rejected alternative, and what the alternative was.>

## Architecture

<How new pieces fit into the existing structure. Include a diagram (ASCII or mermaid) when flow matters.>

### Request flow

1. <Step.>
2. <Step.>

## Components and Interfaces

### <Layer or project name>

- **`<ComponentName>`** — <responsibility.>

```text
<interface or signature sketch in the project's real language>
```

## Data Models

<Schemas, types, DTOs, entities, migrations, configuration keys — whatever the feature touches.>

## Error Handling

<Failure modes and the response for each; map to the IF/THEN criteria in requirements.md.>

## Correctness Properties

### Property 1: <Short title>

*For any* <input domain>, <invariant that must hold>.

**Validates: Requirements 1.1, 1.3**

## Testing Strategy

<Unit, integration and property tests; which properties get automated tests; what is deliberately not tested and why.>
