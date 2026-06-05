# Melbourne Canvas Developer Guidelines

## Purpose

This document defines developer-facing guidelines for implementing and maintaining the Melbourne web application. These guidelines are intended to keep the codebase consistent, testable, and easy to evolve over time.

## Coding Standards

- All production code must be written in TypeScript and typed explicitly where it adds clarity and safety.
- Avoid introducing untyped application code.
- Prefer clear, explicit code over clever abstractions.
- Favor readability and maintainability over compact or overly generic designs.
- Use logging abstractions or logger utilities for logging rather than `print`-style debugging or ad hoc console output in application logic.

## Docstrings and Documentation

- Add docstrings for all functions.
- Docstrings should explain the function's purpose, behavior, or important side effects.
- Docstrings should not merely restate the function name or list parameter names without useful explanation.
- When behavior is non-obvious, docstrings should explain the reasoning or constraint being enforced.

## Architecture and Separation of Concerns

- Keep business rules out of UI code.
- Keep UI concerns out of domain and business-logic modules.
- Prefer separating the codebase into focused layers or modules such as UI, validation, contest parsing, domain logic, rendering, and export workflows.
- Shared logic should live in reusable modules rather than being duplicated across components.
- Prefer explicit, structured errors that the frontend can display clearly.

## Error Handling

- Errors that may be surfaced to the user should be represented in a structured way.
- Validation failures should be returned in a form the UI can render directly and consistently.
- Avoid throwing vague or presentation-hostile errors when a structured validation result is more appropriate.

## Frontend Standards

- Keep frontend code modular.
- Break UI into focused components with clear responsibilities.
- Use shared helpers, components, or utilities for common UI elements and repeated behaviors.
- Avoid placing unrelated business logic directly inside UI components.
- Prefer predictable state transitions and explicit UI state handling over implicit behavior.

## Testing Standards

- Add tests for new behavior as part of the same work that introduces the behavior.
- Unit tests should be added for all new functions where unit testing makes sense.
- Component tests should be added after each module or UI area is completed.
- End-to-end tests should be added for overall user-facing functionality and major workflows.
- Tests should be used to confirm incremental progress after each mini milestone or feature.

## Testing Tools

- Use Vitest for unit tests.
- Use component testing tools that integrate well with the frontend stack. React Testing Library is the leading candidate for component tests.
- Use Playwright for end-to-end browser tests.

## Tooling and Local Commands

### Recommended tooling

- Use `pnpm` for package management.
- Use the TypeScript compiler for type checking.
- Use ESLint with `typescript-eslint` for linting.
- Use Prettier for formatting.

### Typical local commands

- Install dependencies: `pnpm install`
- Run type checking: `pnpm exec tsc --noEmit`
- Run linting: `pnpm exec eslint .`
- Check formatting: `pnpm exec prettier --check .`
- Apply formatting: `pnpm exec prettier --write .`

## Git Workflow

- Do not perform Git commits, rebases, branch changes, or other repository-history actions as part of implementation work.
- The user manages Git actions manually.
- Development work should focus on file changes, tests, and local verification only.

## Quality Checks

- After editing files in a batch for a specific change, run the relevant quality checks before considering the change complete.
- Required checks include:
  - formatting
  - type checking
  - unit tests
  - other applicable tests for the scope of the change
- All required checks should pass before a change is considered complete.

## Practical Expectations

- New code should be written in a way that is easy to test in isolation.
- If a piece of code is hard to test, treat that as a design smell and consider restructuring it.
- Shared rules and reusable logic should generally be tested below the UI layer first, then validated again through component or end-to-end coverage where appropriate.
