# @dotbep/cli

Scaffold and manage a runtime project for a [dotbep](https://github.com/HoyosJuan/dotbep) BEP. The runtime declares handlers and custom lens components that give your BEP dynamic behavior on the [platform](app.dotbep.com).

## Scaffold a new runtime

```bash
npx @dotbep/cli create
```

Then follow the prompts.

## Setup

1. Rename `AGENTS.md` to match your AI agent (`CLAUDE.md`, `GEMINI.md`, etc.), or keep it as `AGENTS.md` for Cursor, Windsurf, Codex CLI, etc.
2. Copy `.env.example` to `.env` and fill in `DOTBEP_TOKEN` and `DOTBEP_BEP_ID`.
3. Run `npm install && npm run pull`.

## Commands

Scaffolding a project adds `@dotbep/cli` as a devDependency, so the rest of these run via `dotbep <command>` inside it.

| Command | What it does |
|---------|-------------|
| `dotbep create`          | Scaffold a new runtime project (this is what `npx @dotbep/cli create` runs) |
| `dotbep pull`            | Download BEP types and refresh generated files |
| `dotbep build runtime`   | Bundle `src/runtime/` → `dist/runtime.cjs` |
| `dotbep build lenses`    | Bundle `src/lenses/` → `dist/lenses.js` |
| `dotbep deploy runtime`  | Build then upload the runtime to the BEP server |
| `dotbep deploy lenses`   | Build then upload the lenses bundle |

## MCP server

dotbep ships an MCP server that gives your coding agent direct access to your BEP in order to read data, manage members, and more.

```json
{
  "dotbep-mcp": {
    "command": "npx",
    "args": ["-y", "@dotbep/mcp@latest"],
    "env": {
      "DOTBEP_TOKEN": "<your-token>"
    }
  }
}
```

Learn how to get your token at [dotbep.com/docs/getting-started.md](https://dotbep.com/docs/getting-started.md).
