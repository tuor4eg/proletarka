IMAGE = ghcr.io/tuor4eg/proletarka:latest
ENV_FILE ?= .env
ENV_EXAMPLE ?= .env.example

ifneq (,$(wildcard .env.local))
  include .env.local
  export
endif

.PHONY: push deploy migrate logs restart stop ps create-user lint sync-env

# Собрать образ локально и запушить в registry
push:
	docker build \
		--build-arg NEXT_PUBLIC_METRIKA_ID=$(NEXT_PUBLIC_METRIKA_ID) \
		-t $(IMAGE) .
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

# Добавить в .env отсутствующие переменные из .env.example без значений
sync-env:
	@test -f "$(ENV_EXAMPLE)" || (echo "$(ENV_EXAMPLE) not found" && exit 1)
	@touch "$(ENV_FILE)"
	@awk -F= '\
		FNR == NR {\
			if ($$0 ~ /^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*[[:space:]]*=/) {\
				key = $$1;\
				gsub(/^[[:space:]]+|[[:space:]]+$$/, "", key);\
				existing[key] = 1;\
			}\
			next;\
		}\
		$$0 ~ /^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*[[:space:]]*=/ {\
			key = $$1;\
			gsub(/^[[:space:]]+|[[:space:]]+$$/, "", key);\
			if (!(key in existing)) {\
				print key "=";\
				added += 1;\
			}\
		}\
		END {\
			if (added > 0) {\
				printf("Added %d missing env variable(s) to $(ENV_FILE)\n", added) > "/dev/stderr";\
			} else {\
				printf("$(ENV_FILE) already has all variables from $(ENV_EXAMPLE)\n") > "/dev/stderr";\
			}\
		}\
	' "$(ENV_FILE)" "$(ENV_EXAMPLE)" >> "$(ENV_FILE)"
