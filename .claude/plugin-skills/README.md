# claude-plugins-official as skills

[`anthropics/claude-plugins-official`](https://github.com/anthropics/claude-plugins-official)
ships its capabilities as **plugins**. A plugin bundles some mix of three
component types, and only one of them is a skill:

| Upstream component | Normally used as | Here |
| --- | --- | --- |
| `skills/<name>/SKILL.md` | a skill | copied, renamed to avoid collisions |
| `commands/<name>.md` | a `/slash-command` | converted to a skill |
| `agents/<name>.md` | a subagent | converted to a skill |

`tools/plugins_to_skills.py` flattens all three into `.claude/skills/`, so every
capability in the directory is reachable as a skill in this repository — no
`/plugin install`, no marketplace, and it works in Claude Code on the web, which
only sees what the repository itself carries.

## Layout

```
.claude/skills/<slug>/SKILL.md    # 92 generated skills (+ their resource files)
.claude/plugin-skills/
  manifest.json                   # upstream commit + what each skill came from
  UPSTREAM_LICENSE                # Apache-2.0, from the upstream repository
  vendor/<plugin>/                # plugin-level assets (scripts/, workflows/, examples/, ...)
tools/plugins_to_skills.py        # the generator
```

## Naming

Slugs are namespaced by plugin so that same-named components can coexist:
`pr-review-toolkit-code-reviewer` vs `feature-dev-code-reviewer`,
`discord-access` vs `telegram-access`. When the component name already equals
the plugin name the prefix is dropped — `frontend-design`, `code-review`,
`math-olympiad`. `manifest.json` maps every slug back to its upstream path.

## What conversion changes

Each generated `SKILL.md` keeps the upstream body verbatim and adds a short
provenance note above it. The note is what makes the non-skill formats work:

- **Commands.** Claude Code preprocesses command files — `$ARGUMENTS`/`$1`
  substitution, `` !`cmd` `` execution, `@path` inlining. Skill bodies are not
  preprocessed, so the note tells the reader to resolve those placeholders.
- **Agents.** An agent body is a system prompt. The note says to follow it as
  operating instructions, and records the `model:` the upstream agent ran on
  (`model:` and `color:` are not skill frontmatter fields).
- **`${CLAUDE_PLUGIN_ROOT}`.** Without a plugin there is no plugin root, so the
  note points at `.claude/plugin-skills/vendor/<plugin>/`, which holds the
  scripts and assets the bodies reach for. It is added only to files that
  actually contain the variable — `plugin-dev`'s skills *teach* you to write
  `${CLAUDE_PLUGIN_ROOT}`, and their examples are left alone.

Frontmatter is rewritten to the skill schema: `tools:` becomes `allowed-tools:`,
values are re-emitted as JSON scalars (always valid YAML), and `name:` is forced
to match the directory, which Claude Code requires.

## Regenerating

```sh
python3 tools/plugins_to_skills.py                     # clone upstream main, rebuild
python3 tools/plugins_to_skills.py --source ../clone   # use a local checkout
python3 tools/plugins_to_skills.py --check             # validate what is committed
```

Only directories carrying the generator's marker comment are removed on a
rebuild, so hand-written skills in `.claude/skills/` survive.

Useful filters when 92 skills is more than you want loaded:

```sh
python3 tools/plugins_to_skills.py --no-agents --no-external
python3 tools/plugins_to_skills.py --only code-review commit-commands feature-dev
python3 tools/plugins_to_skills.py --exclude cwc-makers math-olympiad
```

Every skill description is loaded into context at session start, so the full set
costs a few thousand tokens and gives the model many similar-sounding triggers to
choose between. Narrowing to the plugins you actually use is the cheaper setup.

## Caveats

- Skills converted from **external plugins** (`discord`, `imessage`, `telegram`,
  `asana`) drive third-party services and expect that plugin's MCP server and
  credentials, which this repository does not configure.
- `claude-security` declares `allowed-tools` entries such as
  `Agent(claude-security:scan-inventory)`. Those plugin-namespaced references do
  not resolve outside the plugin; the sub-agents are available here as the
  `claude-security-*` skills instead.
- Upstream hook definitions (`hooks/`) are **not** converted. Hooks are harness
  configuration, not model-facing instructions — they belong in `settings.json`.
  The files are vendored so you can wire them up by hand if you want them.

## Attribution

Generated from `anthropics/claude-plugins-official` (see `manifest.json` for the
exact commit), licensed under the Apache License 2.0 — full text in
`UPSTREAM_LICENSE`. The vendored and generated files are modifications of that
work: frontmatter rewritten, files renamed and relocated, provenance notes added.
Individual plugins may carry their own `LICENSE`; those files are vendored
alongside the content they cover.
