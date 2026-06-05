# Melbourne

<p align="center">
    <img width="96" height="96" src="/public/favicon-96x96.png?raw=true">
</p>

_Melbourne_ is a program that generates scoreboard images for online music song competitions. As a former online competition host, I have found that creating scoreboard images when presenting results is a rather time-consuming activity and repetitive activity. _Melbourne_ was consequently born out of a desire to mostly automate this process and make it easier for me to host competitions.

## Building and Running Locally

You will need [Node](https://nodejs.org/en) and [pnpm](https://pnpm.io/).

Install dependencies:

```bash
pnpm install
```

Start the local development server:

```bash
pnpm dev --host 127.0.0.1
```

Build the production bundle:

```bash
pnpm build
```

Preview the production build locally:

```bash
pnpm preview
```

Run formatting:

```bash
pnpm format
```

Check formatting without changing files:

```bash
pnpm format:check
```

Run type checking:

```bash
pnpm typecheck
```

Run linting:

```bash
pnpm lint
```

Run unit and component tests:

```bash
pnpm test
```

Run end-to-end browser tests:

```bash
pnpm test:e2e
```
