.PHONY: deploy migrate logs restart stop ps create-user

# Пересобрать и перезапустить приложение
deploy:
	docker compose up -d --build app

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

# Создать пользователя: make create-user EMAIL=... HASH=...
create-user:
	docker compose build migrate
	USER_EMAIL='$(EMAIL)' USER_HASH='$(HASH)' docker compose --profile migrate run --rm migrate node scripts/create-user.mjs
