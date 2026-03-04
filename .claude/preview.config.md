# Preview Configuration

## Services

| Service | Port | Health Check URL               | Start Command                     |
|---------|------|--------------------------------|-----------------------------------|
| Web     | 5173 | `http://localhost:5173`        | `pnpm dev --filter=@haude/web`    |
| API     | 3001 | `http://localhost:3001/health` | `pnpm dev --filter=@haude/api`    |
| Admin   | 5174 | `http://localhost:5174`        | `pnpm dev --filter=@haude/admin`  |

## Settings

| Key          | Value                                 |
|--------------|---------------------------------------|
| Base URL     | `http://localhost:5173`               |
| Kill Command | `pnpm kill:servers`                   |
| Shell Init   | `[ -f ~/.zshrc ] && source ~/.zshrc;` |

## Prerequisites

### Before starting API (port 3001)

Check if Prisma client has been generated — only regenerate if missing:

```bash
if [ ! -d "apps/api/node_modules/.prisma/client" ]; then
  cd apps/api && npx prisma generate && cd ../..
fi
```
