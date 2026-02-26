---
description: "Preview haude-monorepo (auto-start web + api + admin servers)"
arguments:
  - name: path
    description: "URL path to preview (default: homepage)"
    required: false
---

# Haude Monorepo Preview

Launch web, API, and admin servers, then open the page in Playwright.

## Parameters

- `$ARGUMENTS`: optional URL path (e.g. `/products`, `/locations`)
  - No args: open `http://localhost:5173`
  - With args: open `http://localhost:5173{path}`

## Steps

### 1. Check server status

Check all three servers **in a single parallel Bash call**:

```bash
echo "web:$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5173 --connect-timeout 2)" && echo "api:$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/health --connect-timeout 2)" && echo "admin:$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5174 --connect-timeout 2)"
```

If all three return 200, skip to Step 3.

### 2. Start missing servers IN PARALLEL

**CRITICAL: Start all missing servers simultaneously using separate `run_in_background` Bash calls in a single message. Do NOT start them sequentially.**

**Before starting**: Run `source ~/.zshrc` once to ensure `ulimit -n 65536`.

**If API server (port 3001) is not running:**

Check if Prisma Client exists first — only regenerate if missing:
```bash
source ~/.zshrc && if [ ! -d "apps/api/node_modules/.prisma/client" ]; then cd apps/api && npx prisma generate && cd ../..; fi && pnpm dev --filter=@haude/api
```

**If Web server (port 5173) is not running:**
```bash
source ~/.zshrc && pnpm dev --filter=@haude/web
```

**If Admin server (port 5174) is not running:**
```bash
source ~/.zshrc && pnpm dev --filter=@haude/admin
```

**Then wait for ALL servers concurrently** in a single poll loop (1-second intervals):
```bash
for i in {1..30}; do
  web=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5173 --connect-timeout 1 2>/dev/null)
  api=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/health --connect-timeout 1 2>/dev/null)
  admin=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5174 --connect-timeout 1 2>/dev/null)
  echo "[$i] web=$web api=$api admin=$admin"
  [ "$web" = "200" ] && [ "$api" = "200" ] && [ "$admin" = "200" ] && echo "All ready!" && break
  sleep 1
done
```

### 3. Open in Playwright

Use `browser_navigate` tool:

- If `$ARGUMENTS` is empty: navigate to `http://localhost:5173`
- If `$ARGUMENTS` has value: navigate to `http://localhost:5173$ARGUMENTS`

### 4. Take snapshot

Use `browser_snapshot` to get the page accessibility tree for further interaction.

## Port Reference

| Service | Port | Health Check |
|---------|------|-------------|
| Web     | 5173 | `curl localhost:5173` |
| API     | 3001 | `curl localhost:3001/health` |
| Admin   | 5174 | `curl localhost:5174` |

## Usage

```
/preview                    # Homepage
/preview /products          # Products page
/preview /locations         # Store locations
/preview /farm-tours        # Farm tours
```

## Notes

- Do NOT close the browser after preview — let the user inspect and interact
- Dev servers keep running in background
- If port is occupied, kill the process first: `kill -9 $(lsof -t -i :PORT)`
- `source ~/.zshrc` is required to set `ulimit -n 65536` and prevent EMFILE errors
