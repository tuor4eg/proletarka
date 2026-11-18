# Подробные цепочки подтверждённых прикладных findings

Пути относительно корня репозитория. Baseline: редакторский CMS — anonymous читает опубликованный контент, admin API требуют серверной авторизации; серверный logout/отзыв прекращает применимость сессии согласно заявленной политике. Сравнение с CMS не заменяет доказательства по коду.

## SEC-01 / MEDIUM — draft metadata

1. `src/proxy.ts:36`, config.matcher: guard охватывает `/admin/:path*`, не `/api/admin/*`.
2. `src/app/api/admin/group-photos/search/route.ts:6`, GET: без auth читает q; `:11` требует минимум два символа.
3. `:25`, GET: select id/title/status; `:35` ограничивает тип group_photo и поиск, но не статус published.
4. `:45`, GET: выбирает имена связанных людей.
5. `:87`, GET: JSON ответа содержит выбранные метаданные, в том числе draft.
6. Аналогичный канал: `src/app/api/admin/materials/search/route.ts:14` → условия `:33`/`:69` без publication predicate → select `:43`/`:59` → return `:146`. Этот API не возвращает status, зато возвращает названия/типы/связи.
7. Публичная страница `src/app/materials/[id]/page.tsx:24–27` отклоняет draft: утечка нарушает существующую границу публикации.

Безопасный запрос **только к локальной/staging копии с fixture data**:

```http
GET /api/admin/group-photos/search?q=Audit HTTP/1.1
Host: fixture.invalid
```

Cookie отсутствует. Fixture draft `Audit Draft` появляется в JSON вместе с ID/status/linkedPeople. Второй безопасный вариант: `GET /api/admin/materials/search?q=Audit`. Production не запрашивался. Ожидаемое поведение после исправления — 401/403 до БД, а администратору по-прежнему доступны черновики.

Выполненный harness использовал исходный GET с fixture DB: подтвердил достижение БД без session и сериализацию draft metadata. SQL/database/NGINX end-to-end не проверены. Риск — раскрытие метаданных, не чтение body/files/секретов.

## SEC-02 / MEDIUM — session revocation

1. `src/lib/session.ts:18`, createSession: подписывает userId/role и задаёт exp; срок константой `:5` — семь суток.
2. `src/app/admin/settings/actions.ts:28`, updatePassword: проверяет текущий пароль и новый пароль, но `:43–47` меняет только hash, не версии/список сессий.
3. `src/lib/session.ts:47`, deleteSession: удаляет cookie текущего клиента, не состояние сервера.
4. `src/lib/session.ts:40`, getSession: принимает по-прежнему корректно подписанный JWT до исходного exp; состояние пароля/отзыва не проверяется.
5. `src/proxy.ts:23`, proxy: допускает дальнейший admin request по тому же токену. Например `src/app/admin/materials/page.tsx:70` читает редакторский контент.

Prerequisite: у атакующего **уже есть** действующая копия session cookie. Аудит не установил способ кражи. Срок не продлевается выходом/сменой пароля. Секрет подписи не ротирован.

Безопасное воспроизведение на фиктивных данных: createSession → copy fixture JWT → deleteSession → убедиться, что fixture cookie пуст → вернуть копию cookie → getSession возвращает исходный userId. Для последующего staging read:

```http
GET /admin/materials HTTP/1.1
Host: fixture.invalid
Cookie: session=<DISPOSABLE_FIXTURE_JWT_ONLY>
```

Это шаблон, не production token; выполнять только на изолированном fixture app. После исправления старый токен после отзыва/смены пароля должен отклоняться, новая сессия — работать.

## DEP-01 — отдельно от прикладного JSON

`package.json:38` / `package-lock.json:10211` закрепляют Next 16.2.0, публичный `src/app/comments/actions.ts:68` использует Server Actions. Версия и используемый feature set удовлетворяют [CVE-2026-64641](https://github.com/vercel/next.js/security/advisories/GHSA-m99w-x7hq-7vfj). Npm snapshot подтверждает affected range. Конкретный DoS payload не исполнялся и не предлагается для production; полноценная runtime exploitation trace отсутствует. Поэтому dependency risk отражён в REPORT и npm snapshot, а не как независимо воспроизведённая прикладная атака в findings.json.
