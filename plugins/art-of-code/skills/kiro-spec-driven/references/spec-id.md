# Next spec id, with no required runtime

`specId` is the highest purely numeric `specId` under `.kiro/specs/*/.config.kiro`, plus one, zero-padded to 4 digits (`0001` when there are none). Non-numeric ids (for example UUIDs from older tooling) and unreadable configs are ignored for counting. Never renumber or reuse an id; a resumed spec keeps its own.

The project's language does not matter. Use whichever of these works on the machine, in this order of preference.

## 1. With the agent's own file tools (no runtime at all)

Glob `.kiro/specs/*/.config.kiro`, read each one, take the numeric `specId` values, add one to the largest, pad to 4 digits. This always works and is the default when unsure about the shell.

## 2. bash (Linux, macOS, Git Bash, WSL)

Run from the project root:

```bash
max=0
for f in .kiro/specs/*/.config.kiro; do
  [ -f "$f" ] || continue
  id=$(sed -n 's/.*"specId"[[:space:]]*:[[:space:]]*"\([0-9][0-9]*\)".*/\1/p' "$f")
  [ -n "$id" ] && [ "$((10#$id))" -gt "$max" ] && max=$((10#$id))
done
printf '%04d\n' $((max + 1))
```

## 3. PowerShell (Windows)

```powershell
$max = 0
Get-ChildItem .kiro/specs -Directory -ErrorAction SilentlyContinue | ForEach-Object {
  $cfg = Join-Path $_.FullName '.config.kiro'
  if (Test-Path $cfg) {
    try { $id = (Get-Content $cfg -Raw | ConvertFrom-Json).specId } catch { $id = $null }
    if ("$id" -match '^\d+$') { $max = [Math]::Max($max, [int]$id) }
  }
}
'{0:D4}' -f ($max + 1)
```

## 4. Node (optional convenience)

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/kiro-spec-driven/scripts/next-spec-id.mjs" .
```

Only use this when Node is already on the machine; the plugin never requires it.
