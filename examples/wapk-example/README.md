# WAPK Example App

A simple HTTP server demonstrating **WAPK live-sync** functionality in `elit`.

## What This Tests

✅ **WAPK Packaging** - Pack a project into `.wapk` archive  
✅ **Live-Sync** - Changes to working files are automatically synced back to `.wapk`  
✅ **Polling Mode** - Default sync every 300ms  
✅ **Watcher Mode** - Event-driven sync (faster)  
✅ **Runtime Inference** - Detects runtime from `scripts.start` and `package.json`  

## Quick Start

### Prerequisites
- `bun` runtime installed
- `elit` CLI installed or runnable with `npx`

### Run Tests

**Polling mode (default 300ms sync interval):**
```bash
# Windows (PowerShell)
.\test-wapk.ps1

# Linux/macOS (bash)
bash test-wapk.sh
```

**Watcher mode (event-driven):**
```bash
# Windows (PowerShell)
.\test-wapk.ps1 -Watcher

# Linux/macOS (bash)
PORT=3333 bash test-wapk.sh --watcher
```

### Manual Testing

1. **Pack the project:**
   ```bash
   npx elit wapk pack . --output-path app.wapk
   ```

2. **Inspect archive:**
   ```bash
   npx elit wapk inspect app.wapk
   ```

3. **Run with polling (custom interval):**
   ```bash
   npx elit wapk run app.wapk --sync-interval 200
   ```

4. **Run with watcher (faster):**
   ```bash
   npx elit wapk run app.wapk --watcher
   ```

5. **In another terminal, trigger file creation:**
   ```bash
   curl http://localhost:3333/create-marker
   curl http://localhost:3333/status
   curl http://localhost:3333/shutdown
   ```

## Project Structure

```
wapk-example/
├── package.json              # npm metadata (name, version, scripts)
├── elit.config.json          # elit config with wapk section
├── src/
│   └── server.ts             # Simple HTTP server
├── test-wapk.ps1             # PowerShell test script
├── test-wapk.sh              # Bash test script
└── README.md                 # This file
```

## How Live-Sync Works

1. **Pack**: Project → `.wapk` archive (binary with header + files)
2. **Extract**: `.wapk` → temp working directory
3. **Run**: Start app from working directory
4. **Monitor**: Polling (300ms) or watcher detects file changes
5. **Sync**: Changed files → re-encode and update `.wapk` archive
6. **Cleanup**: Delete temp directory on exit

## Configuration

### elit.config.json

```json
{
  "wapk": {
    "name": "@elit/wapk-example",
    "version": "1.0.0",
    "runtime": "bun",
    "entry": "src/server.ts",
    "port": 3333,
    "desktop": {
      "width": 1024,
      "height": 768,
      "title": "WAPK Example App"
    }
  }
}
```

### CLI Flags

- `--sync-interval <ms>` - Polling interval (default: 300, min: 50)
- `--watcher / --use-watcher` - Use event-driven sync instead of polling
- `--runtime node|bun|deno` - Override runtime (if not in config)

## Server Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Health check |
| `/status` | GET | Current status (JSON) |
| `/create-marker` | GET | Create a test marker file |
| `/shutdown` | GET | Graceful shutdown |

## Files Generated During Test

- `wapk-runtime.log` - Server log (synced to `.wapk`)
- `marker-*.txt` - Test marker files (synced to `.wapk`)
- `example-app.wapk` - Packed archive
- `.elit-config-*.mjs` - Temp config file (excluded from archive)

Test script auto-cleans these up on exit.

## Expected Test Flow

```
[1/4] Packing project into WAPK...
      ✓ WAPK packed: example-app.wapk (650 bytes)

[2/4] Inspecting WAPK archive...
      Header: @elit/wapk-example v1.0.0 (bun runtime)
      Entry: src/server.ts
      Files: 4 entries

[3/4] Running with polling mode (300ms)...
      → Sending requests...
        Request 1 (health): ✓
        Request 1 (marker): ✓
        ... more requests ...

[4/4] Verifying live-sync...
      ✓ Log file was created and synced into WAPK
      ✓ Marker files created: 3
```

## Troubleshooting

**Server won't start:**
- Check port 3333 is not in use: `lsof -i :3333` or `netstat -ano | findstr 3333`
- Try a different port: `PORT=8080 bash test-wapk.sh`

**Live-sync not working:**
- Check polling interval is reasonable (50ms - 5000ms)
- Try watcher mode for debugging: `--watcher --sync-interval 100`
- Verify working directory has write permissions

**Archive inspection shows no new files:**
- May take extra sync cycle; check log timestamps
- Increase `--sync-interval` if running on slow system

## Next Steps

- Add multi-runtime support (test with node, deno)
- Add desktop app variant (uses GUI window)
- Profile sync performance under heavy file changes
- Add incremental archive updates (partial reserialize)
