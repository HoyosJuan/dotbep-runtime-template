# create-dotbep-runtime

Scaffold a runtime project for a [dotbep](https://github.com/HoyosJuan/dotbep) BEP — the handlers and custom lens components that give your BEP dynamic behavior on the [platform](app.dotbep.com).

Works equally well with an AI agent or a human developer.

## Usage

```bash
npm create dotbep-runtime@latest
```

Then follow the prompts.

## Setup

1. Rename `AGENTS.md` to match your AI agent (`CLAUDE.md`, `GEMINI.md`, etc.), or keep it as `AGENTS.md` for Cursor, Windsurf, or Codex CLI.
2. Copy `.env.example` to `.env` and fill in `DOTBEP_TOKEN` and `DOTBEP_BEP_ID`.
3. Run `npm install && npm run pull`.
