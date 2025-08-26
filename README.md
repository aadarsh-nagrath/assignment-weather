# Weather Dashboard

A modern weather dashboard built with Next.js, TypeScript, Tailwind, shadcn/ui. Uses WeatherAPI.com for current + forecast.

## Highlights
- Multi-city display, add/remove, autocomplete
- Current + 5-day + hourly timeline
- Dark/Light modes, Neon/Stealth theme variants
- Unit toggle (°C/°F, km/h/mph), city reorder
- Auto-refresh every 15 minutes
- Server caching: Prisma `WeatherCache` (30m TTL) + optional Redis L1 cache

## Setup
1. Install deps and set env
```bash
npm install
```
`.env.local`
```env
WEATHERAPI_KEY=your_weatherapi_key_here
DATABASE_URL="file:./dev.db"
# Optional
REDIS_URL=redis://localhost:6379
```
2. DB
```bash
npx prisma generate
npx prisma db push
npm run db:seed # optional
```
3. Run
```bash
npm run dev
```

## Docker (docker-manage.sh)
This repository includes a compose stack (web + Postgres + Redis) and a helper script.

### One-time
```bash
chmod +x docker-manage.sh
```

### Configure
Edit or create `.env.local` (script will bootstrap one if missing):
```env
WEATHERAPI_KEY=your_weatherapi_key_here
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/weatherdb?schema=public
REDIS_URL=redis://redis:6379
NODE_ENV=production
```

### Commands
```bash
./docker-manage.sh up        # start web, postgres, redis
./docker-manage.sh down      # stop and remove stack
./docker-manage.sh build     # build images
./docker-manage.sh rebuild   # rebuild w/ no cache and recreate
./docker-manage.sh restart   # restart services
./docker-manage.sh logs      # follow logs
./docker-manage.sh ps        # list services
./docker-manage.sh migrate   # run prisma migrate deploy, then db push
./docker-manage.sh seed      # seed demo data
./docker-manage.sh sh        # shell into web container
```

Notes:
- If host port 6379 is busy, compose maps Redis on host 6380 while in-network stays `redis:6379`.
- The app inside Docker uses `postgres` and `redis` service names; local host access would be `localhost:3000`.

## API
- `GET /api/weather?city=City&country=CC`
  - Returns cached (DB/Redis) weather if fresh (<30m), else fetches from WeatherAPI and stores.
- `GET /api/weather/search?q=del` – autocomplete suggestions
- `GET /api/cities` – ordered list
- `POST /api/cities` – add (auto-geocode); or reorder with `{ id, direction: 'up'|'down' }`
- `DELETE /api/cities?id=...` – remove
- `GET /api/prefs` – fetch preferences (units/theme/mode)
- `POST /api/prefs` – save preferences for default user

## Assumptions
- Single demo user (`id=default`); auth out of scope
- DB used for cities, cache, and preferences; client localStorage still used for instant UX
- Redis is optional; app runs without it

## Known Limitations
- No real auth/multi-user tenancy
- City order/API reorder is simple swap; drag-and-drop can be added
- Radar/map not yet implemented

## Future Work
- Drag-and-drop reorder; groups/collections
- Radar/precipitation maps per city
- Scheduled server refresh + webhooks
- Postgres + Redis in production

## AI Tools Used
- Cursor/AI-assisted coding; shadcn/ui generator
