# Manual HTML conventions

Exact HTML patterns for editing `docs/manual.html`. Read this before applying an approved
proposal, so the emitted markup matches the file's existing style instead of a plausible
guess — the manual is hand-maintained and a mismatched row is visible in the rendered page.

## Table row (alias/command)

```html
<tr>
    <td><code>alias_name</code></td>
    <td><code>actual_command</code> &mdash; description</td>
</tr>
```

## Table row (keyboard shortcut)

```html
<tr>
    <td><kbd>⌘</kbd>+<kbd>T</kbd></td>
    <td>Action description</td>
</tr>
```

## Table row (config setting)

```html
<tr>
    <td>Setting Name</td>
    <td>value or description</td>
</tr>
```

## New h3 subsection with table

```html
<h3>Tool Name</h3>
<table>
    <thead>
        <tr>
            <th>Alias</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <!-- rows here -->
    </tbody>
</table>
```

## Flow block (workflow)

```html
<div class="flow-only">
    <strong>Flow: Workflow name</strong><br />
    <code>step1</code> &rarr; <code>step2</code> &rarr; result
</div>
```

## New section (rare — new tool category)

```html
<details
    id="section-id"
    open
>
    <summary>N. Section Name</summary>
    <div class="section-content">
        <!-- h3 subsections and tables -->
    </div>
</details>
```

Also requires: sidebar `<a href="#section-id">` link and renumbering subsequent sections.

## Styling rules

- `<code>` for aliases, commands, config values, file paths
- `<kbd>` for physical keys: `⌘`, `⌥`, `Ctrl`, `⇧`, `Esc`, `Tab`, letter/number keys
- `&mdash;` for em-dash separators in descriptions
- `&rarr;` for flow arrows
- `&harr;` for bidirectional arrows
