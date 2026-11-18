# Безопасная диагностика VPS

Запустить **на VPS из каталога production Compose «Пролетарки»**. Скрипт ничего не меняет, не посылает запросов к сайту/S3/webhooks, не читает данные приложения. PostgreSQL получает короткую read-only транзакцию через действующие credentials внутри контейнера, без вывода DSN/паролей. Если pg недоступен в standalone image, секция завершится кодом ошибки без её текста — DBA должен выполнить аналогичные SELECT отдельно.

Не включать `set -x`. Не заменять выборочные команды на полный `docker inspect`, `docker compose config`, `env`, `nginx -T` или дамп БД при отправке результата в чат. Даже очищенный inventory может содержать внутренние имена/адреса — проверить перед передачей.

```bash
#!/usr/bin/env bash
set -u

# Запускать из нужного Compose-каталога; sudo используется только для чтения nginx/nft/ss.
APP_ID="$(docker compose ps -q app 2>/dev/null)"
if [ -z "$APP_ID" ] || [[ "$APP_ID" == *$'\n'* ]]; then
    echo 'Нужен ровно один запущенный service app текущего Compose-проекта.'
    exit 1
fi

uname -sr
cat /etc/os-release | sed -n '/^PRETTY_NAME=/p'
docker version --format 'Docker server={{.Server.Version}}'
docker info --format 'Docker security={{json .SecurityOptions}}'
dpkg-query -W -f='${binary:Package} ${Version}\n' nginx nginx-common openssl libc6 2>/dev/null || true
sudo ss -lnt

# Только безопасно выбранные поля; env, command, labels и contents mounts не печатаются.
CONTAINER_IDS="$(docker ps -q)"
if [ -n "$CONTAINER_IDS" ]; then
    docker inspect $CONTAINER_IDS | python3 -c '
import json,sys
for c in json.load(sys.stdin):
    h=c.get("HostConfig",{}); n=c.get("NetworkSettings",{})
    print(json.dumps({
      "name":c.get("Name"),"image":c.get("Config",{}).get("Image"),
      "image_id":c.get("Image"),"user":c.get("Config",{}).get("User"),
      "privileged":h.get("Privileged"),"readonly_rootfs":h.get("ReadonlyRootfs"),
      "cap_add":h.get("CapAdd"),"cap_drop":h.get("CapDrop"),
      "security_opt":h.get("SecurityOpt"),"network_mode":h.get("NetworkMode"),
      "pid_mode":h.get("PidMode"),"ipc_mode":h.get("IpcMode"),
      "memory":h.get("Memory"),"nano_cpus":h.get("NanoCpus"),"pids_limit":h.get("PidsLimit"),
      "ports":n.get("Ports"),"networks":sorted(n.get("Networks",{})),
      "mounts":[{"type":m.get("Type"),"target":m.get("Destination"),"rw":m.get("RW")} for m in c.get("Mounts",[])]
    },ensure_ascii=False))'
fi

docker exec "$APP_ID" id
docker exec "$APP_ID" sh -c 'cat /etc/os-release | sed -n "/^PRETTY_NAME=/p"'
docker exec -i "$APP_ID" node <<'NODE'
const names=['next','react','react-dom','sharp','pg','drizzle-orm','jose'];
console.log('Runtime:',process.version,process.platform,process.arch);
for (const name of names) {
 try { console.log(name,require(name+'/package.json').version); }
 catch { console.log(name,'version unavailable via package exports'); }
}
console.log('SECURE_COOKIES_enabled:',process.env.SECURE_COOKIES==='true');
console.log('NODE_ENV_production:',process.env.NODE_ENV==='production');
for (const name of ['DATABASE_URL','SESSION_SECRET','ALTCHA_HMAC_KEY','IMPORT_API_SECRET','S3_ACCESS_KEY','S3_SECRET_KEY','OUTBOUND_EVENTS_SECRET']) {
 console.log(name+'_configured:',Boolean(process.env[name]));
}
NODE

# Выводятся только разрешённые несекретные nginx-директивы.
# Если nginx находится в контейнере, эту секцию выполнить там аналогично, сохранив фильтр.
sudo nginx -T 2>&1 | python3 -c '
import re,sys
allowed=re.compile(r"^(listen|server_name|ssl_protocols|client_max_body_size|limit_req_zone|limit_req|limit_conn|real_ip_header|set_real_ip_from|real_ip_recursive)\s|^proxy_set_header\s+(Host|X-Forwarded-For|X-Real-IP|X-Forwarded-Proto|X-Forwarded-Host)\s|^add_header\s+Strict-Transport-Security\s",re.I)
for line in sys.stdin:
    s=line.strip()
    if allowed.match(s):print(s)
'

# Общие firewall политики/число правил без полного дампа значений правил.
if command -v nft >/dev/null; then
 sudo nft -j list ruleset 2>/dev/null | python3 -c '
import json,sys
try: data=json.load(sys.stdin)
except Exception: print("nft inventory unavailable");sys.exit(0)
items=data.get("nftables",[])
for item in items:
 c=item.get("chain")
 if c and c.get("hook"):print({k:c.get(k) for k in ("family","table","name","hook","policy")})
print("nft rules:",sum("rule" in x for x in items))
'
fi

# Только каталоги/права PostgreSQL, без таблиц приложения, паролей или иных БД.
docker exec -i "$APP_ID" node <<'NODE'
(async()=>{
 let client;
 try {
  const {Client}=require('pg');
  client=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:5000,query_timeout:5000});
  await client.connect();
  await client.query('BEGIN READ ONLY');
  await client.query("SET LOCAL statement_timeout='3s'");
  const checks=[
   ['identity',`SELECT current_user, current_database(), current_setting('server_version') AS version, current_setting('transaction_read_only') AS read_only`],
   ['current_role',`SELECT rolname,rolsuper,rolcreaterole,rolcreatedb,rolreplication,rolbypassrls FROM pg_roles WHERE rolname=current_user`],
   ['memberships',`SELECT rolname,rolsuper,rolcreaterole,rolcreatedb,rolreplication,rolbypassrls FROM pg_roles WHERE pg_has_role(current_user,oid,'MEMBER') ORDER BY rolname`],
   ['database_privileges',`SELECT datname,pg_get_userbyid(datdba)=current_user AS owned,has_database_privilege(current_user,oid,'CONNECT') AS can_connect,has_database_privilege(current_user,oid,'CREATE') AS can_create FROM pg_database WHERE NOT datistemplate ORDER BY datname`],
   ['schema_privileges',`SELECT nspname,pg_get_userbyid(nspowner)=current_user AS owned,has_schema_privilege(current_user,oid,'USAGE') AS can_use,has_schema_privilege(current_user,oid,'CREATE') AS can_create FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname <> 'information_schema' ORDER BY nspname`],
   ['table_privilege_counts',`SELECT n.nspname,count(*) AS tables,count(*) FILTER (WHERE has_table_privilege(current_user,c.oid,'SELECT')) AS readable,count(*) FILTER (WHERE has_table_privilege(current_user,c.oid,'INSERT,UPDATE,DELETE')) AS writable_any,count(*) FILTER (WHERE pg_get_userbyid(c.relowner)=current_user) AS owned FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN ('r','p') AND n.nspname NOT LIKE 'pg_%' AND n.nspname <> 'information_schema' GROUP BY n.nspname ORDER BY n.nspname`],
   ['connection_tls',`SELECT ssl,version,cipher FROM pg_stat_ssl WHERE pid=pg_backend_pid()`]
  ];
  for(const [name,sql] of checks)console.log(name,JSON.stringify((await client.query(sql)).rows));
  await client.query('ROLLBACK');
 }catch(e){console.log('DB diagnostic unavailable; code=',e.code||'NO_CODE');}
 finally{if(client)await client.end().catch(()=>{});}
})()
NODE
```

## Как оценивать результат

- App UID не 0; нет privileged/host PID/Docker socket, лишних host mounts/capabilities. Inspect показывает **добавленные/снятые** capabilities, `cap_add=null` не означает отсутствие default capabilities.
- App порт должен быть loopback; порты PostgreSQL не должны слушать публичный интерфейс без специально обоснованной защиты. `ss` не показывает полностью внешние firewall/cloud ACL — проверить правила у хостера. Число nft правил не доказывает закрытость порта.
- Сопоставить сети «Пролетарки» и «Гикотеки». Общая сеть даёт потенциальную связность, но не доказывает доступ к данным. Проверить межконтейнерные firewall rules локально; не сканировать соседей этим блоком.
- В NGINX проверить HTTPS redirect, HSTS, явную перезапись IP/Host заголовков и лимиты обоих входов. Если XFF строится через `$proxy_add_x_forwarded_for`, а приложение берёт первый элемент, проверить очистку клиентского XFF и цепочку real_ip. Отсутствие вывода nginx-секции может означать ошибку/другой контейнер, а не отсутствие конфигурации.
- DB role: `rolsuper`, `rolcreaterole`, `rolcreatedb`, `rolreplication`, `rolbypassrls` обычно false для runtime; членство в `pg_read_server_files`, `pg_write_server_files`, `pg_execute_server_program` опасно. Владение таблицами допускает DDL; выделить migration role.
- `can_connect=true` к чужой БД не означает SELECT её данных. Права на таблицы других БД нельзя доказать каталогами текущей; DBA отдельно проверяет grants/role ownership/pg_hba **в каждой БД**, без чтения прикладных строк. Запросы не пытаются соединяться с чужими БД.
- TLS к БД внутри приватной Docker-сети — вопрос модели угроз; `ssl=false` не равен публичной утечке. Внешний/hoster DB endpoint требует отдельной проверки защищённости соединения.
- Для полного inventory OS advisories нужны актуальные пакеты/метаданные и политика security updates; блок не выполняет apt update/upgrade.
- Реальную политику Hostkey/S3 проверить в панели оператора: отдельные ключи, bucket/prefix scope, отсутствие anonymous write/delete/list при ненужности; приватный контент не хранить под публичным read prefix. Не копировать сами ключи или policy credentials в отчёт.
