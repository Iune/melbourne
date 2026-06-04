# Melbourne Canvas Project Design

## Status

This document is a working draft. It currently captures only the requirements and decisions that have been agreed so far. Additional sections for tech stack, milestones, architecture details, and developer guidelines will be added incrementally.

## Purpose

The new version of Melbourne will be a browser-based application that generates scoreboard images for online music song contests. The existing `melbourne/` project is the reference implementation for contest parsing, scoring semantics, layout behavior, and visual design.

The active development project is `canvas/`.

## Product Goals

- Run entirely in the web browser with no backend server.
- Work across common browsers and operating systems.
- Generate deterministic exported PNG scoreboard images regardless of browser or OS.
- Preserve compatibility with the existing Melbourne contest spreadsheet format and scoreboard design.

## Core Constraints

### Client-side only

- All parsing, validation, image generation, and ZIP packaging must happen client-side in the browser.
- The application must not require a backend server for normal operation.

### Cross-browser deterministic rendering

- Exported PNG scoreboards must be generated through a deterministic client-side rendering pipeline.
- The final exported image output must not depend on browser-native DOM rendering or browser-specific canvas text rendering behavior.
- A Skia-based browser rendering solution such as CanvasKit is the leading candidate for evaluation, but this is not yet a final implementation commitment.

### Visual compatibility

- V1 should preserve the existing Melbourne scoreboard visual design.
- The output does not need to match the old desktop version pixel-for-pixel.
- The existing `melbourne/` codebase should be treated as the behavioral and visual reference during implementation.

## User Workflow

1. The user visits the web app in the browser.
2. The app displays a form-based UI.
3. The user fills out the form and selects the contest spreadsheet.
4. The user clicks `Generate`.
5. The app validates the contest file and referenced bundled flags.
6. If validation succeeds, the app generates all scoreboard PNG images.
7. The app packages the generated PNG files into a ZIP archive.
8. The app shows a success state with a `Download ZIP` button.

## Single-screen UI Model

The app should operate as a single-screen interface.

- The form remains visible throughout the workflow.
- A status/results area below the form changes based on the current state.
- Form values should remain populated across state changes so the user can correct inputs or regenerate without starting over.

## UI States

### 1. Initial idle form

- The form is visible and editable.
- No validation errors, progress, or success output are shown yet.

### 2. Validation failed

- The form remains visible and editable.
- Blocking validation errors are displayed below the form.
- Errors should be shown in a structured format, such as a table.

### 3. Generating

- The form remains visible but inputs should be disabled while generation is running.
- A progress bar is displayed below the form.
- The primary form action changes from `Generate` to `Cancel` while generation is in progress.

### 4. Generation succeeded

- The form remains visible and can be edited again.
- A success state is displayed below the form.
- A `Download ZIP` button is displayed.

## Form Fields

The initial web form should include:

- Contest name
- Contest file
- Checkbox for whether the contest file contains a `Count` / `# Voters` column
- Main color
- Accent color
- Checkbox to include flags, default `yes`
- Checkbox to draw flag borders, default `yes`

### Field specification

- `Contest name`
  - Control type: text input
  - Required for generation: yes
  - Default value: empty

- `Contest file`
  - Control type: file picker
  - Required for generation: yes
  - Supported file type in V1: `.xlsx`

- `Contains Count / # Voters column`
  - Control type: checkbox
  - Required for generation: no
  - Default value: unchecked / `false`
  - Purpose: indicates that the spreadsheet includes the extra count column used by the existing Melbourne format

- `Main color`
  - Control type: color picker
  - Required for generation: always has a value
  - Default value: `#2F292B`
  - Additional UI: reset-to-default control

- `Accent color`
  - Control type: color picker
  - Required for generation: always has a value
  - Default value: `#FCB906`
  - Additional UI: reset-to-default control

- `Include flags`
  - Control type: checkbox
  - Required for generation: always has a value
  - Default value: checked / `true`

- `Draw flag borders`
  - Control type: checkbox
  - Required for generation: always has a value
  - Default value: checked / `true`
  - Behavior: when `Include flags` is unchecked, this control becomes disabled but retains its current value
  - Note: while flags are disabled, the flag border setting is a no-op

- `Custom flag groups`
  - Control type: not present in the V1 UI
  - Required for generation: no
  - Default value: not shown in the V1 UI
  - Future intent: allow user-provided custom flag packs in a later version

### Form readiness

- The `Generate` action should be enabled when:
  - `Contest name` is non-empty, and
  - a contest `.xlsx` file has been selected
- Other fields do not block generation because they always have a valid default or current value

### Form layout

- Form fields should appear in the same order listed in this document.
- Each field should be presented on its own line rather than using side-by-side multi-column field layout.
- The main color reset control should appear next to the main color picker.
- The accent color reset control should appear next to the accent color picker.
- The custom flag group section should be hidden for now rather than shown in a disabled state.
- The primary action button should appear below all form fields.
- The state-specific output region should appear below the primary action button.
- That output region should display the progress bar, validation error table, or success/download area depending on the current state.

## Validation Rules

V1 uses only blocking validation errors. There is no warnings-only state.

### Contest file validation

- The contest file must be a valid supported spreadsheet.
- If the spreadsheet is malformed, generation must stop.
- Validation errors must be displayed to the user in a structured list or table.

### Flag validation

- If flags are enabled, the app must validate that all referenced flags exist in bundled assets.
- If one or more referenced flags are missing, generation must stop.
- Missing flags must be displayed to the user as blocking errors.

### Color validation

- Main and accent colors are selected through color pickers.
- Invalid color text entry is not part of the supported UI model.
- The UI should provide a way to reset main and accent colors to the default Melbourne values.

### Validation error presentation

- V1 should use a simple validation error table.
- The table can contain just error messages for now.
- One row should be displayed for each individual error.
- Example: if three flags are missing, the table should contain three separate rows.
- Additional structure such as error categories, row references, or warning levels can be added later if needed.

## Contest File Compatibility

The web version should preserve the existing Melbourne spreadsheet format and scoring semantics.

- Input format support for V1 is `XLSX` only.
- `XLS`, `ODS`, and `CSV` are out of scope for V1.
- Spreadsheet structure and semantics should match the existing `melbourne/` program.
- Existing vote parsing behavior should be preserved, including `dq` handling.
- Existing ranking and tie-break logic should be preserved.
- Unused rows and columns that are not part of the parsed contest data can be ignored.

## Asset Model

### Bundled assets

- The app should bundle default fonts and flag assets with the program.
- The existing `Assets/flags` structure in `melbourne/` is the reference model.
- Flag references in spreadsheets use pack-relative paths such as `ISC/Kaledonii.png`.

### Custom assets

- V1 will not show custom flag group upload controls in the UI.
- Full support for user-uploaded custom flags is planned for a later iteration.

### Secure flag resolution

- Spreadsheet flag references must be treated as logical asset identifiers, not trusted file paths.
- Flag path handling must prevent path traversal or escaping the bundled flags root.
- If a referenced flag filename or extension does not match an existing bundled file exactly, it is treated as missing.

## Output Requirements

### PNG generation

- The app generates one PNG scoreboard image per voter reveal.
- The scoreboard sequence must follow the contest voters in order.

### PNG filenames

- PNG filenames should follow the pattern `01 - <voter name>.png`.
- Output filenames must be sanitized to be safe for download and archive use.

### ZIP output

- All generated PNG files should be packaged into a ZIP archive.
- The ZIP filename should use the sanitized contest name.
- The app should not force an immediate download on completion.
- Instead, after generation succeeds, the app should show a `Download ZIP` button.

## Progress and Cancellation

- Validation happens before generation and is not included in the progress bar.
- The progress bar tracks generated scoreboard images only.
- Progress increments by one unit per completed PNG.
- Example: if there are 30 voters, the progress bar range is `0` to `30`.
- ZIP packaging does not need separate progress reporting in V1.

- The UI must remain responsive during generation.
- The user must be able to cancel generation while it is in progress.
- Canceling generation should discard any outputs from the current run and return the app to an editable state.

### Primary action behavior

- In idle and validation-failed states, the primary action button label is `Generate`.
- When generation starts, that same button changes label and behavior to `Cancel`.
- The button should remain in the same location while its label and action change.
- After cancellation or successful completion, the button changes back to `Generate`.
- The success state should present a separate `Download ZIP` button below the form.

## Performance Expectations

- V1 should not define an artificial contest-size limit.
- The app should comfortably support at least typical real-world usage comparable to the existing program, such as contests with roughly 30 to 50 voters.
- The implementation should be designed to keep the UI responsive during rendering and archive creation.

## Recommended Tech Stack

### Language

- The web app should be written in TypeScript.
- Strong typing should be used throughout the codebase to reduce basic type-related errors and improve maintainability.

### UI framework

- React is the recommended UI framework for the web application.
- The app is small enough to stay simple, but React still provides a clean structure for form state, UI state transitions, and testability.
- Mantine is the selected component library for the application UI.
- Mantine is preferred for this project because it provides a polished, feature-rich React UI toolkit with strong TypeScript support and straightforward theming, including typography customization.
- The UI component library is separate from the exported scoreboard rendering pipeline.

### Build and development tooling

- Vite is the recommended build tool and development server.
- The project should build to static assets that can be hosted without a backend server.

### Rendering engine

- A deterministic client-side rendering engine is required for final exported PNG generation.
- A Skia-based browser runtime such as CanvasKit is the leading candidate for V1.
- The exported image pipeline should avoid depending on browser-native DOM rendering or browser-specific canvas text behavior.

### Spreadsheet parsing

- XLSX spreadsheet parsing should happen client-side in the browser.
- A browser-compatible TypeScript-friendly spreadsheet parsing library should be used.
- SheetJS is the leading candidate for V1.

### ZIP creation

- ZIP packaging should happen client-side in the browser after image generation completes.
- JSZip is the leading candidate for V1.

### Background processing

- The UI must remain responsive while generation is running.
- Generation work should therefore be designed to run off the main UI thread.
- A Web Worker-based generation pipeline is the recommended direction for V1.

## Deployment Model

- The app should be deployable as a static site with no backend server.
- The preferred deployment targets include platforms such as GitHub Pages and Cloudflare Pages.
- The app should also be easy to run locally during development.
- Local usage should assume running from a local static server or development server rather than depending on raw `file://` browser loading.

## Testing Strategy

- The project should be highly testable in all major areas.
- TypeScript typing and automated tests are both core quality requirements.
- Tests should be added incrementally alongside each mini milestone or feature so that progress remains continuously verified.

### Unit tests

- Unit tests verify small, isolated pieces of logic with minimal dependencies.
- Unit tests are the primary tool for business logic and pure data-processing behavior.

Examples include:

- spreadsheet parsing helpers
- vote parsing
- `dq` handling
- cumulative score calculation
- ranking and tie-break logic
- validation functions
- filename sanitization
- secure flag path resolution

### Component tests

- Component tests verify UI components or small groups of components in isolation.
- These tests focus on rendering, state behavior, and user interaction at the component level.

Examples include:

- form default values
- `Generate` enablement rules
- `Include flags` and `Draw flag borders` interaction
- error table rendering
- progress UI rendering
- `Generate` to `Cancel` button switching
- success state rendering with `Download ZIP`

### End-to-end browser tests

- End-to-end browser tests verify the real app workflow in a real browser environment.
- These tests are used to validate full user flows and browser-specific integration behavior.

Examples include:

- opening the app and generating from a valid `.xlsx` file
- validation failure flow for malformed spreadsheets
- validation failure flow for missing flags
- generation progress updates
- canceling generation
- successful generation and ZIP download availability

### Recommended test tools

- Vitest is the recommended test runner for unit tests.
- React Testing Library is the recommended tool for component tests.
- Playwright is the recommended tool for end-to-end browser tests.
- Playwright is preferred over Selenium for V1 because it is a strong fit for modern TypeScript applications and supports Chromium, Firefox, and WebKit.

## Milestone Plan

This milestone plan is intentionally incremental. Early milestones should focus on establishing project structure, state flow, parsing, worker behavior, cancellation, and export mechanics before full scoreboard rendering is implemented.

Each milestone should include:

- implementation of the milestone scope
- unit tests where applicable
- component tests once the relevant UI module is complete
- end-to-end browser tests for major user-facing workflows when appropriate
- passing quality checks before the milestone is considered complete

### Milestone 1: Project Scaffold

Goal:

- Establish the base web application and developer tooling.

Scope:

- Create the Vite + React + TypeScript project structure.
- Configure package management, scripts, and project layout.
- Add TypeScript configuration.
- Add ESLint, Prettier, and test tooling configuration.
- Add Vitest, React Testing Library, and Playwright setup.
- Add any initial app shell, placeholder page, and static asset structure needed for future work.
  - UI should just have the header/navbar: "Melbourne" (links to the home page), "Help" (blank link for now) and "Flags" (blank link for now).

Acceptance criteria:

- The app runs locally in development mode.
- The app builds successfully as a static site.
- Formatting, linting, type checking, and test commands are wired up.
- A minimal starter test suite runs successfully.

### Milestone 2: Render the Form UI

Goal:

- Render the full V1 form with the correct fields, defaults, and layout, without backend or generation logic.

Scope:

- Render all form controls in the agreed order.
- Apply default values for colors and checkboxes.
- Hide the custom flag upload section.
- Place the primary action button below the form.
- Reserve the state-specific output region below the button.
- Implement the `Generate` button enablement rule based on contest name and selected `.xlsx` file.
- Implement the `Include flags` and `Draw flag borders` interaction.

Acceptance criteria:

- The form matches the agreed V1 field list and layout.
- Default values are correct.
- The primary button enablement behavior works as specified.
- The flag-border checkbox disables correctly when flags are turned off while preserving its value.

### Milestone 3: UI State Flow Prototype

Goal:

- Prove the single-screen state model and primary action behavior before real generation logic exists.

Scope:

- Implement the core UI states:
  - idle
  - generating
  - generation succeeded
- Make the primary action switch from `Generate` to `Cancel` while generating.
- Add a dummy progress bar implementation.
- Simulate progress from 1 to 10 with timed updates.
- Support canceling the simulated generation flow and returning to editable form state.
- On mock completion, transition into a success state instead of returning directly to idle.
- Show the same general success-region structure expected in the real app, even if the download action is still placeholder behavior at this stage.

Acceptance criteria:

- Clicking `Generate` enters generating state.
- The progress bar advances using mock progress.
- The primary action changes to `Cancel` during generation.
- Clicking `Cancel` stops the mock generation flow and returns the UI to editable state.
- After mock completion, the UI enters a success state rather than returning directly to idle.
- The success-region layout is present in a form that can later be reused for real generation output.

### Milestone 4: XLSX Parsing and Error Display

Goal:

- Support loading the contest spreadsheet and surfacing parsing or validation errors in the UI.

Scope:

- Read the selected `.xlsx` file in the browser.
- Parse workbook data client-side.
- Implement the Melbourne-compatible contest parsing rules.
- Implement malformed-file validation behavior.
- Display parsing and validation errors in the error table.
- Keep the form populated while displaying errors.

Acceptance criteria:

- A valid `.xlsx` file can be read and parsed into contest data.
- Malformed spreadsheet inputs produce blocking validation errors.
- Errors are displayed in the UI as one row per error.
- The app does not enter generation mode when parsing/validation fails.

### Milestone 5: Worker, Cancellation, and ZIP Pipeline with Placeholder Outputs

Goal:

- Prove the background generation/export workflow before implementing real scoreboard image rendering.

Scope:

- Move generation work off the main UI thread.
- Implement progress reporting from background processing to the UI.
- Implement cancellation of in-progress generation.
- Use parsed contest data to generate placeholder output files instead of PNGs.
- Generate one empty text file per voter using the naming pattern `01 - <voter name>.txt`.
- Package the generated text files into a ZIP archive.
- Show the success state and expose the `Download ZIP` button.

Acceptance criteria:

- The UI remains responsive while generation is running.
- Progress updates once per generated placeholder file.
- Cancellation stops the current run and discards its outputs.
- A successful run produces a ZIP archive containing one correctly named placeholder file per voter.
- The `Download ZIP` button is shown only after successful completion.

### Future milestones

The milestones above are intended to establish application structure, browser workflow, worker architecture, and export mechanics first. Additional milestones will be defined for scoreboard rendering itself, including:

- deterministic rendering engine integration
- font and bundled asset loading
- flag validation and secure asset resolution during rendering flow
- first real scoreboard PNG generation
- parity work against the `melbourne/` reference implementation
- renderer regression testing and visual verification

### Milestone 6: Flag Validation and Secure Asset Resolution

Goal:

- Validate referenced bundled flags correctly and ensure spreadsheet-provided flag paths are handled securely.

Scope:

- Bundle the flags and font files for the scoreboard generation. Keep in mind that the bundled flags need to be accessed by the program to be loaded by skia/canvaskit. But we only want to actually load files into memory that are actually used (i.e. on demand).
- Implement exact-match validation for bundled flag references from contest data.
- Support the existing pack-relative flag reference format such as `ISC/Kaledonii.png`.
- Reject path traversal or any attempt to escape the bundled flags root.
- Treat incorrect filenames or extensions as missing flags.
- Surface flag validation failures in the validation error table as one row per error.

Acceptance criteria:

- Valid bundled flag references pass validation.
- Missing or incorrectly named flags are reported as blocking errors.
- Escaping or unsafe flag paths are rejected as invalid references.
- Each invalid or missing flag is displayed as a separate error row.

### Milestone 7: First Basic Scoreboard Rendering

Goal:

- Prove the rendering engine, bundled font loading, and image export path with the simplest possible real PNG output.

Scope:

- Load the bundled font through the chosen browser-side rendering pipeline.
- Generate a real PNG image using the rendering engine.
- Render the text `Hello world` using the bundled font.
- Size the output image so the text fits cleanly.
- Center the text within the image.
- Keep this milestone focused on rendering mechanics rather than contest layout.

Acceptance criteria:

- The app can generate and export real PNG output in the browser.
- Bundled font loading works in the rendering pipeline.
- The output image contains centered `Hello world` text rendered with the bundled font.
- The image is sized appropriately for the rendered text.

### Milestone 8: Scoreboard Generation Without Flags

Goal:

- Implement the first real contest-driven scoreboard generation flow without flag rendering.

Scope:

- The existing scoreboard generation code used SkiaSharp, while we are using Skia/CanvasKit. While the former is in C# and our code is in Typescript, the functions should generally be similar since both are wrappers to Skia.
- Use parsed contest data to generate scoreboard PNGs for each voter.
- Recreate the scoreboard layout structure without drawing flags.
- Implement title, voter header, entry ordering, point totals, and awarded-points display.
- Preserve the Melbourne sorting and scoreboard sequencing behavior.
- Generate ZIP output containing real scoreboard PNGs rather than placeholder text files.

Acceptance criteria:

- A valid contest file produces one real scoreboard PNG per voter.
- Scoreboards reflect the correct order, points, and voter sequence from the parsed contest data.
- The no-flags version of the scoreboard layout renders successfully.
- ZIP output contains correctly named PNG files.

### Milestone 9: Flag Rendering in Scoreboards

Goal:

- Add bundled flag rendering into the real scoreboard generation pipeline.

Scope:

- Load bundled flag images during scoreboard rendering.
- Render flags in the correct scoreboard positions.
- Support the `Include flags` option.
- Support the `Draw flag borders` option.
- Preserve existing no-flags behavior when flags are disabled.

Acceptance criteria:

- When flags are enabled and valid, scoreboards render with bundled flags.
- When flag borders are enabled, borders render correctly around flags.
- When flags are disabled, scoreboards render correctly without flags.
- Flag rendering integrates cleanly with the existing scoreboard layout and output flow.

## Existing Reference

The `melbourne/` project should be used as the reference for:

- contest spreadsheet structure
- vote parsing semantics
- ranking and tie-break behavior
- default colors and text-contrast behavior
- scoreboard layout and visual design
- asset organization conventions
