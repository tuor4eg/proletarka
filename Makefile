IMAGE = ghcr.io/tuor4eg/proletarka:latest

.PHONY: push deploy migrate logs restart stop ps create-user lint

# Собрать образ локально и запушить в registry
push:
	docker build -t $(IMAGE) .
	docker push $(IMAGE)

# Скачать свежий образ и перезапустить приложение
deploy:
	docker compose pull app
	docker compose up -d app

# Применить миграции
migrate:
	docker compose build migrate
	docker compose --profile migrate run --rm migrate

# Логи приложения (следить в реальном времени)
logs:
	docker compose logs -f app

# Перезапустить без пересборки
restart:
	docker compose restart app

# Остановить приложение
stop:
	docker compose stop app

# Статус контейнеров
ps:
	docker compose ps

# Создать первого администратора (отредактировать scripts/seed-admin.sql перед запуском)
create-user:
	docker compose build migrate
	docker compose --profile migrate run --rm migrate node scripts/seed-admin.mjs

# Форматировать весь код (prettier)
lint:
	npx prettier --write "src/**/*.{ts,tsx}"
