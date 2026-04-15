# Wiki Operating Manual

You are maintaining a structured technical knowledge base for this project.
Read this file at the start of every wiki session. Follow these conventions exactly.

## Your Role

You compile knowledge from raw sources (code, docs, notes) into structured wiki pages.
- You READ raw sources but NEVER modify them.
- You CREATE and UPDATE wiki pages in `wiki/`.
- You LOG every action in `wiki/log.md`.
- You CROSS-REFERENCE between pages using `[[page-name]]` syntax.

## Folder Layout

```
wiki/
  CLAUDE.md          ← this file
  index.md           ← master catalog (update after every change)
  log.md             ← append-only activity log (update after every action)
  stack.md           ← tech stack, deps, versions, environment
  architecture/      ← architecture decisions, component boundaries, patterns
  api/               ← API endpoints grouped by surface
  schema/            ← data models, DB schemas, migration history
  flows/             ← user flows, common code execution paths
  concepts/          ← domain concepts, glossary, terminology
  sources/           ← one file per ingested raw source (summaries only)
```

## Page Frontmatter

Every page MUST start with this frontmatter:

```yaml
---
type: stack|architecture|api|schema|flow|concept|source-summary
project: <project-name>
status: active|stale|deprecated
confidence: high|medium|low
last_updated: YYYY-MM-DD
sources: []
---
```

- `confidence: high` = verified from authoritative source (code, official docs)
- `confidence: medium` = inferred from patterns or indirect evidence
- `confidence: low` = uncertain, needs verification

## Page Body Structure

```markdown
---
[frontmatter]
---

# <Title>

## Summary
[1-3 sentence plain-English overview]

## Details
[Main content — specific, factual, with exact values where known]

## Related
- [[other-wiki-page]]
- [[another-page]]
```

## Operations

### After any ingest or update:
1. Update the relevant wiki pages (create new or update existing).
2. Update `wiki/index.md` — add/update the entry for every changed page.
3. Append to `wiki/log.md` with timestamp, action, and affected pages.

### Contradiction handling:
- If new info contradicts existing, update the page and note the change in a `## History` section.
- Do NOT silently overwrite — document what changed and why.

### Stale detection:
- Flag pages with `status: stale` if sources are >3 months old or contradict newer sources.

### Cross-references:
- Use `[[filename-without-extension]]` syntax.
- Link both ways: if page A references B, add A to B's `## Related` section.

## Log Format

Append to `wiki/log.md` in this format:

```
## YYYY-MM-DD HH:MM — <action>

- Action: ingest|update|lint|query|init
- Sources: [files or notes processed]
- Pages created: [list]
- Pages updated: [list]
- Notes: [anything notable]
```
