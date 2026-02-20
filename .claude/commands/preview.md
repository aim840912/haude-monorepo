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

Check all three servers in parallel:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 --connect-timeout 2
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health --connect-timeout 2
curl -s -o /dev/null -w "%{http_code}" http://localhost:5174 --connect-timeout 2
```

### 2. Start missing servers

**IMPORTANT**: Before starting any server, raise the file descriptor limit:
```bash
source ~/.zshrc  # ensures ulimit -n 65536
```

**If API server (port 3001) is not running:**

1. Ensure Prisma Client is up to date:
```bash
cd apps/api && npx prisma generate
```

2. Start API server in background:
```bash
source ~/.zshrc && pnpm dev --filter=@haude/api
```

3. Wait for API to be ready (poll /health):
```bash
for i in {1..15}; do
  curl -s http://localhost:3001/health > /dev/null && break
  sleep 2
done
```

**If Web server (port 5173) is not running:**

1. Start web dev server in background:
```bash
source ~/.zshrc && pnpm dev --filter=@haude/web
```

2. Wait for web server to be ready:
```bash
for i in {1..15}; do
  curl -s http://localhost:5173 > /dev/null && break
  sleep 2
done
```

**If Admin server (port 5174) is not running:**

1. Start admin dev server in background:
```bash
source ~/.zshrc && pnpm dev --filter=@haude/admin
```

2. Wait for admin server to be ready:
```bash
for i in {1..15}; do
  curl -s http://localhost:5174 > /dev/null && break
  sleep 2
done
```

**If multiple servers are not running**, start them in parallel (separate background commands).

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
