# DeepWiki MCP evaluation

Date: 2026-08-31

## Decision

Keep DeepWiki permanently configured, with a narrow routing contract:

1. Use Context7 for published API, configuration, and migration documentation.
2. Use DeepWiki for architecture and cross-file implementation discovery on an already-indexed public repository.
3. Use `gh_grep` or direct GitHub source retrieval for exact file paths, current implementation details, revision-sensitive claims, and final evidence.

DeepWiki produced a useful architecture answer, but its implementation details lag the repository's current default branch and its citations did not identify exact source files. This is not a systematic factual collapse or a new material privacy finding, so it does not overturn the permanent configuration. It does make direct-source verification mandatory for exact claims. Never send private repository names to the public service.

## Official documentation

- [DeepWiki MCP](https://docs.devin.ai/work-with-devin/deepwiki-mcp)
- [DeepWiki public repository indexing](https://docs.devin.ai/work-with-devin/deepwiki)
- [Codex MCP](https://developers.openai.com/codex/mcp)
- [OpenCode v1 MCP servers](https://thdxr.dev.opencode.ai/docs/mcp-servers/) — the shape used by the installed OpenCode `1.18.25`
- [Current OpenCode MCP servers](https://opencode.ai/docs/mcp-servers/) — documents the newer schema and warns that MCP tools consume model context
- [Junie MCP configuration](https://junie.jetbrains.com/docs/junie-cli-mcp-configuration.html)

The documentation establishes these guarantees:

- DeepWiki offers a free remote MCP service for public repositories, documents three main public tools, and recommends the Streamable HTTP endpoint `https://mcp.deepwiki.com/mcp`.
- Private repository support belongs to the separate authenticated Devin service and is not a capability of this public entry.
- Codex supports Streamable HTTP servers, reads the MCP `instructions` returned at initialization, stores MCP state in its Codex configuration, and shares that state between the Codex CLI, IDE extension, and ChatGPT desktop app on the same host.
- OpenCode supports remote MCP configuration and warns that enabled MCP servers and tools consume model context.
- Junie supports user-scope MCP configuration at `~/.junie/mcp/mcp.json`, with remote URLs under `mcpServers.<name>.url`.

The documentation does **not** guarantee a fixed DeepWiki server version, fixed response schemas, exact error text, indexed freshness, default-branch snapshot behavior, or stateless transport. No advertised public DeepWiki tool parameter selects a branch, tag, commit, or revision. Those points below are dated runtime observations, not promises about future behavior.

## Measurement method

The comparison uses the exact question from the change design:

> How does the plugin determine which tsconfig applies to an imported file, and what changes between lazy and eager projectDiscovery? Cite the relevant source files.

Measurements count one semantic payload delivered to the model. They do not double-count MCP responses that mirror the same value in `content` and `structuredContent`.

- **Bytes:** UTF-8 byte length.
- **Words:** whitespace-separated `\S+` count.
- **Token estimate:** `ceil(UTF-8 bytes / 4)` for every measured payload.
- **Tool schemas:** compact JSON serialization of `result.tools`.
- **Latency:** wall-clock time from immediately before request write until the matching response was parsed.

Raw wire sizes are reported only where useful for explaining envelope duplication; they are not treated as model-visible context.

## DeepWiki runtime observations

All DeepWiki probes used only `https://mcp.deepwiki.com/mcp` and did not mutate client configuration.

### Initialize and persistent context

| Observation | Result |
| --- | --- |
| Initialize status and latency | HTTP 200 in `0.528015 s` |
| Protocol | `2025-06-18` |
| Server identity | `DeepWiki 2.14.3` |
| Session header | No `MCP-Session-Id` response header |
| Raw initialize body | `3,102 bytes` |
| Model-visible instructions | `2,770 bytes`, `382 words`, `~693 tokens` |
| `tools/list` latency | `0.604289 s` |
| Raw tools-list body | `1,586 bytes` |
| Compact three-tool schemas | `1,516 bytes`, `55 words`, `~379 tokens` |
| Combined instructions + schemas | `4,287 bytes`, `437 words`, `~1,072 tokens` |

The extra byte in the combined measurement is the separator used when concatenating instructions and schemas. This is a protocol-level estimate of persistent model-visible material, not a claim that every client serializes it identically. Codex is the client whose official documentation explicitly says it consumes server instructions.

The public `tools/list` response exposed exactly:

- `ask_question`
- `read_wiki_contents`
- `read_wiki_structure`

The initialization instructions also describe numerous private-mode Devin tools that are not exposed by the public tools list. That unused prose accounts for much of the fixed instruction overhead.

### Indexed and unindexed probes

The exact benchmark question against indexed `aleclarson/vite-tsconfig-paths` completed in `9.683884 s`. Its single model-visible answer measured `2,804 bytes`, `363 words`, and `~701 tokens`. The raw body was `5,827 bytes` because the transport mirrored the answer in `content` and `structuredContent`; the comparison counts it once.

The unindexed `etherless/dotfiles` structure probe completed in `0.572081 s`. Its model-visible response measured `124 bytes`, `13 words`, and `~31 tokens`:

> Repository not found. Visit https://deepwiki.com/etherless/dotfiles to index it.

This is an observed failure path. It shows that the MCP call did not index the repository on demand.

## Context7 runtime observations

The comparison used the pinned stdio server:

```sh
bunx @upstash/context7-mcp@2.1.2
```

The server identified itself as Context7 `2.1.2`. `resolve-library-id` selected `/aleclarson/vite-tsconfig-paths`, reporting 76 snippets, High reputation, and a benchmark score of 90.13.

The exact `query-docs` request completed in `2.030500358 s`. The single model-visible response measured `4,195 bytes`, `489 words`, and `~1,049 tokens`.

## Response comparison

| Path | Latency | Model-visible bytes | Words | Estimated tokens | Citation quality |
| --- | ---: | ---: | ---: | ---: | --- |
| DeepWiki `ask_question` | `9.683884 s` | 2,804 | 363 | 701 | Named functions and DeepWiki wiki/search pages, but no exact repository file citations |
| Context7 `query-docs` | `2.030500358 s` | 4,195 | 489 | 1,049 | Cited only Context7's aggregated `llms.txt`, not exact repository files |

### DeepWiki coverage

DeepWiki correctly conveyed the high-level flow:

- Resolver selection starts at the importer and walks ancestor directories.
- Cached projects and resolvers are considered along that path.
- Resolvers are tried until one resolves; a matching resolver can stop further lookup.
- Eager discovery is the default and loads projects in advance.
- Lazy discovery scans relevant importer ancestors on demand.
- `baseUrl`, `paths`, `include`, and `exclude` affect applicability and resolution.

Its citations were discovery aids rather than source evidence. It named relevant functions but did not cite exact repository files despite the prompt; its links led to generated DeepWiki wiki/search pages.

Direct source inspection found stale implementation details in the answer:

- It said eager discovery occurs in `buildStart`. Current initialization is created and reset from `configResolved`; `buildStart` resets it only for later builds.
- It attributed eager scanning to `tsconfck.findAll`. Current source uses `findAllProjects`, and resolver construction now uses `oxc-resolver`.

The high-level explanation remains substantially correct, but those details reflect an older indexed snapshot.

### Context7 coverage

Context7 correctly described:

- `projectDiscovery` defaults to eager.
- Eager mode scans at startup, while lazy mode defers discovery until relevant imports.
- `include` and `exclude` restrict which importers a configuration governs.

It omitted ancestor traversal mechanics, resolver ordering, the directory/project caches, and first-match stopping behavior. It cited only `https://context7.com/aleclarson/vite-tsconfig-paths/llms.txt`. Its monorepo and alias examples had no exact source provenance, and its discussion of `lazy` together with `projects` obscured that explicitly configured projects are loaded through the eager-project path while lazy ancestor discovery remains active.

## `gh_grep` and direct-source verification

A read-only `gh_grep` MCP `searchGitHub` call searched the literal `projectDiscovery` pattern with repository filter `aleclarson/vite-tsconfig-paths`. It returned `src/types.ts`, `src/resolver.ts`, `test/resolver.test.ts`, and `README.md`. Direct retrieval of the current GitHub source then verified the comparison against these exact files:

- [`src/index.ts`](https://github.com/aleclarson/vite-tsconfig-paths/blob/master/src/index.ts)
  - `configResolved` constructs and resets the resolver store.
  - `buildStart` skips the first build and resets later builds.
  - `resolveId` asks `tsconfigResolvers.get(importerFile)` for candidate resolvers, returns the first resolution, and stops after a resolver reports a match with no result.
- [`src/resolver.ts`](https://github.com/aleclarson/vite-tsconfig-paths/blob/master/src/resolver.ts)
  - `directoryCache` and `resolversByProject` hold cached discovery/resolver state.
  - `loadEagerProjects` loads explicit projects or calls `findAllProjects`; it returns early for lazy discovery only when no explicit `projects` list is supplied.
  - `discoverProjects` scans one directory on demand in lazy mode.
  - `getResolvers` walks from the importer toward the filesystem root and collects resolvers from each directory.
  - `createResolver` constructs the current OXC-backed resolver and applies importer support plus `include`/`exclude` filtering.
- [`src/types.ts`](https://github.com/aleclarson/vite-tsconfig-paths/blob/master/src/types.ts)
  - Documents lazy ancestor discovery and eager startup discovery, with eager as the default.
- [`README.md`](https://github.com/aleclarson/vite-tsconfig-paths/blob/master/README.md)
  - Provides the public eager/lazy option overview.
- [`test/resolver.test.ts`](https://github.com/aleclarson/vite-tsconfig-paths/blob/master/test/resolver.test.ts)
  - Exercises eager, lazy, and explicit-project discovery behavior.

This verification supports the routing decision: both services are useful discovery layers, but neither response satisfied the request for exact current source citations without a separate source lookup.

## Privacy and operational conclusion

The evaluation found no authentication material, write-capable public tool, or other new privacy issue in the public three-tool surface. The known privacy boundary remains important: even a failed public lookup discloses the repository name to the provider, so private or Nazaries repositories must not be queried through this entry.

The observed staleness is meaningful but localized and detectable by direct-source verification. It does not justify discarding DeepWiki or silently changing the planned availability model. The permanent entry is acceptable only with the routing and privacy limits stated at the top of this report.
