# Архитектура и границы доверия

Дата: 2026-11-18 (Europe/Moscow). Код: `046a695ea632c601b10e4a547f52f868e07b4d7c` и текущее рабочее дерево. Предыдущих запусков в `.security-audits/proletarka/` не было. В рабочем дереве уже были изменения инструкций/скилла; аудит их не изменял.

## Назначение и стек

Редакторский цифровой музей: анонимное чтение людей, объектов, опубликованных материалов; премодерируемые комментарии; доверенная админка без разделения редакторских ролей. Базовый аналог — небольшой редакторский CMS: публичное чтение ожидаемо, чтение черновиков и редакторские изменения требуют администратора. Отсутствие per-record ownership между полностью доверенными администраторами само по себе не IDOR.

Lockfile: Next.js 16.2.0 App Router, React/ReactDOM 19.2.4, TypeScript, Drizzle ORM 0.45.1, pg 8.20.0, jose 6.2.2, bcryptjs 3.0.3, altcha-lib 1.4.1, @aws-sdk/client-s3 3.1014.0; Sharp 0.34.5 транзитивно через Next. Production runner — node:22-alpine, UID 1001. Эти версии не доказывают версий реально работающего image.

Пользователь сообщил: Debian 13 VPS, Docker, NGINX HTTPS, PostgreSQL в отдельном контейнере, Hostkey S3; соседняя «Гикотека» на том же VPS с отдельными БД/бакетом. NGINX, фактические роли/ACL PostgreSQL, policies S3 и контейнерные overrides не предоставлены.

## Акторы и контроль

- Посетитель: публичные страницы; `createComment`; `GET /api/comments/challenge`; image redirect.
- Администратор: cookie `session`, HS256, срок 7 суток, HttpOnly/Lax, Secure через настройку. Роль в schema только admin. Proxy проверяет JWT на `/admin/:path*`; не покрывает `/api/admin/*`. Settings проверяют сессию/существующего пользователя; большинство остальных CRUD полагаются на proxy. Layout скрывает навигацию, но не отклоняет children.
- Интеграция импорта: отдельный общий секрет в заголовке, fail-closed, timingSafeEqual; topic read и создание человека/событий. Не получает административную сессию; набор полей ограничен.
- Оператор: доверенные env-настройки, endpoint/bucket/webhook destinations и ключи. Значения секретов не читались и не публиковались.

## Поверхности и потоки

- Login actions: `src/app/login/actions.ts`, `src/app/admin/login/actions.ts` → parameterized lookup users → bcrypt compare → signed session.
- CRUD: `src/app/admin/{actions.ts,people/actions.ts,artifacts/actions.ts,entities/actions.ts,topics/actions.ts,settings/actions.ts,comments/actions.ts}` → Drizzle/S3 → logs/redirect/revalidate.
- Admin GET API: `/api/admin/{people,materials,group-photos,sources}/search`, сессионных guards нет. Материалы/group photos включают metadata черновиков.
- Import: `src/app/api/import/person/route.ts` → auth → body stream ≤100000 bytes → validation → transaction createPersonRecord; `/api/import/topics` → auth → tree read.
- Upload: admin action FormData → file.arrayBuffer → declared MIME/10MiB checks → UUID object key `uploads/*` → S3; deletion restricted to upload-key grammar. Нет image decode, subprocess или локального исполнения файла.
- Serving: `src/lib/imageUrl.ts` → `/api/images/[...key]` → encoded redirect на фиксированный env origin. Публичность бакета предусмотрена конфигурацией; это не private-media gateway.
- Comments: body/author/target/honeypot → ALTCHA HMAC+expiry → IP hash quotas → pending insert → outbound event JSON to env-only webhook. IP доверяет первому XFF, quota check/insert неатомарны.
- Rendering: JSX text interpolation; published filters на публичных material queries. `dangerouslySetInnerHTML` только Metrika с build-time env. SQL templates фиксированы/ORM parameterized; untrusted SQL identifiers, eval/subprocess sinks не найдены.
- Compose: loopback app port, external backend network, host-gateway, runtime secrets в env. PostgreSQL service и NGINX отсутствуют в репозитории. Runtime non-root; privileged/socket/host bind volumes не заданы. Migrator имеет DDL и использует ту же переменную DATABASE_URL.

## Покрытие и доказательства

Два reviewer исследовали auth и import/storage/rendering; третий независимо проверил findings. Координатор проверил комментарии, dependency audit и доступную инфраструктуру. Полная production-сборка, запуск приложения, DB queries и любые сетевые запросы к production не выполнялись. Безопасные локальные tests: image key 3/3, image route 2/2; React render harness проверил escaping. npm audit all с актуальным registry получен после повторной попытки; exit 1 означает найденные advisories. Полный snapshot сохранён.

Требуют отдельной проверки: actual image/version/platform; transport-specific dispatch и action manifest; NGINX auth/rate/header policy; Postgres role/CONNECT/ownership/pg_hba; S3 IAM/bucket policies; Docker networks/limits/mounts; OS/NGINX/Postgres security updates. Source-аудит не доказывает отсутствие всех уязвимостей.
