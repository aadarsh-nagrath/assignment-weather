#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="weather-dashboard"
COMPOSE_FILE="docker-compose.yml"

usage() {
  echo "Usage: $0 {up|down|build|rebuild|restart|logs|ps|migrate|seed|sh|bash|clean}";
}

ensure_env() {
  if [ ! -f .env.local ]; then
    cat > .env.local <<EOF
WEATHERAPI_KEY=changeme
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/weatherdb?schema=public
REDIS_URL=redis://redis:6379
NODE_ENV=production
EOF
    echo ".env.local created. Please edit WEATHERAPI_KEY."
  fi
}

case "${1:-}" in
  up)
    ensure_env
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up -d
    ;;
  down)
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" down
    ;;
  build)
    ensure_env
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" build
    ;;
  rebuild)
    ensure_env
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" build --no-cache
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up -d --force-recreate
    ;;
  restart)
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" restart
    ;;
  logs)
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" logs -f --tail=200
    ;;
  ps)
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" ps
    ;;
  migrate)
    set +e
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" exec -T web npx prisma migrate deploy
    set -e
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" exec -T web npx prisma db push
    ;;
  seed)
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" exec -T web node scripts/seed.js
    ;;
  sh|bash)
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" exec web sh
    ;;
  clean)
    # Full cleanup: containers, images, volumes, orphans
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" down --rmi all --volumes --remove-orphans || true
    docker image prune -f || true
    docker volume prune -f || true
    ;;
  *)
    usage
    exit 1
    ;;
 esac
