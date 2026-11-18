const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const test = require("node:test")
const { loadServerModule } = require("./helpers/load-server-module.cjs")

const admin = { id: 7, name: "Fixture Admin", email: "admin@example.invalid", role: "admin" }
const validSession = { userId: admin.id, role: "admin" }
const redirect = (url) => {
    throw new Error(`REDIRECT:${url}`)
}
const schema = new Proxy(
    {},
    {
        get: (_, table) =>
            new Proxy({}, { get: (_, column) => `${String(table)}.${String(column)}` }),
    },
)
const orm = new Proxy({}, { get: () => () => ({}) })
const jsx = require("react/jsx-runtime")
const fixtureComponent = () => null
const componentModule = new Proxy(
    {},
    { get: (_, key) => (key === "__esModule" ? false : fixtureComponent) },
)

function authorization(session, user = admin) {
    const lookups = []
    const auth = loadServerModule("src/lib/adminAuth.ts", {
        "next/navigation": { redirect },
        "drizzle-orm": orm,
        "@/db/schema": schema,
        "@/lib/session": { getSession: async () => session },
        "@/db": {
            db: {
                select: (projection) => {
                    lookups.push(projection)
                    return {
                        from: () => ({
                            where: () => ({ limit: async () => (user ? [user] : []) }),
                        }),
                    }
                },
            },
        },
    })
    return { auth, lookups }
}

const refused = [
    ["no session", null, admin, 401],
    ["invalid session", undefined, admin, 401],
    ["malformed user ID", { userId: "7", role: "admin" }, admin, 401],
    ["unsafe user ID", { userId: Number.MAX_SAFE_INTEGER + 1, role: "admin" }, admin, 401],
    ["missing role", { userId: 7 }, admin, 401],
    ["deleted account", validSession, null, 401],
    ["non-admin token", { userId: 7, role: "reader" }, admin, 403],
    ["non-admin database account", validSession, { ...admin, role: "reader" }, 403],
]
for (const [label, session, user, status] of refused) {
    test(`authorization rejects ${label}`, async () => {
        const { auth, lookups } = authorization(session, user)
        assert.equal((await auth.getAdminAccess()).status, status)
        await assert.rejects(auth.requireAdmin(), /REDIRECT:\/admin\/login/)
        if (status === 401 && label !== "deleted account") assert.equal(lookups.length, 0)
    })
}

test("administrator receives only the identity projection", async () => {
    const { auth, lookups } = authorization(validSession)
    const access = await auth.getAdminAccess()
    assert.equal(access.user.id, admin.id)
    assert.equal((await auth.requireAdmin()).email, admin.email)
    assert.deepEqual(Object.keys(lookups[0]).sort(), ["email", "id", "name", "role"])
    assert.equal("password" in access.user, false)
})

test("actual session verifier rejects bad signatures and expired fixture tokens", async () => {
    const jose = await import("jose")
    const secret = "disposable-regression-key-never-production"
    const key = new TextEncoder().encode(secret)
    const expired = await new jose.SignJWT(validSession)
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(1)
        .sign(key)
    const valid = await new jose.SignJWT(validSession)
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("1h")
        .sign(key)
    const wrongKey = await new jose.SignJWT(validSession)
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("1h")
        .sign(new TextEncoder().encode("another-disposable-fixture-key"))
    for (const token of ["invalid-fixture-jwt", wrongKey, expired, valid]) {
        const sessionModule = loadServerModule(
            "src/lib/session.ts",
            {
                jose,
                "next/headers": { cookies: async () => ({ get: () => ({ value: token }) }) },
            },
            undefined,
            { SESSION_SECRET: secret },
        )
        const session = await sessionModule.getSession()
        if (token === valid) assert.equal(session.userId, admin.id)
        else assert.equal(session, null)
    }
})

function listFiles(directory, basename) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((item) => {
        const filename = path.join(directory, item.name)
        return item.isDirectory()
            ? listFiles(filename, basename)
            : item.name === basename
              ? [filename]
              : []
    })
}

function isolatedEntry(filename, auth, overrides = {}) {
    const effects = []
    const forbidden = (name) => {
        effects.push(name)
        throw new Error(`PROTECTED_EFFECT:${name}`)
    }
    const opaque = new Proxy(
        function () {
            return forbidden("dependency call")
        },
        {
            get: (_, property) =>
                property === "__esModule" ? false : property === "then" ? undefined : opaque,
        },
    )
    const cache = new Map()
    function load(file) {
        if (cache.has(file)) return cache.get(file)
        const module = loadServerModule(
            file,
            {
                "@/lib/adminAuth": auth,
                "@/db": {
                    db: new Proxy(
                        {},
                        { get: (_, property) => () => forbidden(`db.${String(property)}`) },
                    ),
                },
                "@/db/schema": schema,
                "@/lib/s3": {
                    resolveImageUpload: () => forbidden("s3.upload"),
                    deleteImage: () => forbidden("s3.delete"),
                },
                "@/lib/logAdminAction": { logAdminAction: () => forbidden("admin log") },
                "drizzle-orm": orm,
                "drizzle-orm/pg-core": { alias: (table) => table },
                "react/jsx-runtime": jsx,
                react: require("react"),
                "next/link": fixtureComponent,
                "next/navigation": {
                    redirect,
                    notFound: () => {
                        throw new Error("NOT_FOUND")
                    },
                },
                "next/cache": { revalidatePath: () => forbidden("revalidate") },
                "next/server": {
                    NextResponse: { json: (body, init) => Response.json(body, init) },
                },
                ...overrides,
            },
            (id, parent) => {
                if (id.startsWith("@/components/")) return componentModule
                const source = id.startsWith("@/app/admin/")
                    ? `src/${id.slice(2)}`
                    : id.startsWith(".")
                      ? path.resolve(path.dirname(parent), id)
                      : null
                if (source && fs.existsSync(`${source}.ts`) && source.endsWith("/actions"))
                    return load(`${source}.ts`)
                return opaque
            },
        )
        cache.set(file, module)
        return module
    }
    return { entry: load(filename), effects }
}

const actionFiles = listFiles("src/app/admin", "actions.ts").filter(
    (file) => !file.includes(`${path.sep}login${path.sep}`),
)
const protectedPages = listFiles("src/app/admin", "page.tsx").filter(
    (file) => !file.includes(`${path.sep}login${path.sep}`),
)

for (const [label, session, user] of refused) {
    test(`all admin actions reject ${label} before domain DB, S3 or logging`, async () => {
        const { auth } = authorization(session, user)
        for (const file of actionFiles) {
            const { entry, effects } = isolatedEntry(file, auth)
            for (const [name, action] of Object.entries(entry)) {
                if (typeof action !== "function") continue
                await assert.rejects(
                    async () => action(),
                    /REDIRECT:\/admin\/login/,
                    `${file}:${name}`,
                )
            }
            assert.deepEqual(effects, [], file)
        }
    })
    test(`all protected pages reject ${label} before reading editorial data`, async () => {
        const { auth } = authorization(session, user)
        for (const file of protectedPages) {
            const { entry, effects } = isolatedEntry(file, auth)
            await assert.rejects(
                async () =>
                    entry.default({
                        params: Promise.resolve({ id: "91", code: "fixture" }),
                        searchParams: Promise.resolve({}),
                    }),
                /REDIRECT:\/admin\/login/,
                file,
            )
            assert.deepEqual(effects, [], file)
        }
    })
}

const apiFiles = listFiles("src/app/api/admin", "route.ts")
for (const [label, session, user, status] of refused) {
    test(`every admin API returns ${status} for ${label} without domain queries`, async () => {
        const { auth } = authorization(session, user)
        for (const file of apiFiles) {
            const { entry, effects } = isolatedEntry(file, auth)
            const response = await entry.GET({
                nextUrl: new URL("http://fixture.invalid/?q=Audit"),
            })
            assert.equal(response.status, status, file)
            assert.deepEqual(effects, [], file)
        }
    })
}

function readDatabase(rowsFor) {
    return {
        select(fields) {
            const rows = rowsFor(fields)
            const query = new Proxy(
                {},
                {
                    get: (_, key) =>
                        key === "then"
                            ? Promise.resolve(rows).then.bind(Promise.resolve(rows))
                            : () => query,
                },
            )
            return query
        },
    }
}

test("admin group-photo and material search retain draft metadata and relationships", async () => {
    const { auth } = authorization(validSession)
    for (const kind of ["group-photos", "materials"]) {
        const db = readDatabase((fields) =>
            fields.linkedPersonName
                ? [{ materialId: 91, linkedPersonName: "Fixture Person" }]
                : fields.personName && !fields.title
                  ? [{ materialId: 91, personName: "Fixture Person" }]
                  : [
                        {
                            id: 91,
                            title: "Audit Draft",
                            status: "draft",
                            materialType: "group_photo",
                            personName: null,
                            artifactTitle: null,
                        },
                    ],
        )
        const { entry } = isolatedEntry(`src/app/api/admin/${kind}/search/route.ts`, auth, {
            "@/db": { db },
        })
        const response = await entry.GET({ nextUrl: new URL("http://fixture.invalid/?q=Audit") })
        assert.equal(response.status, 200)
        const rows = await response.json()
        assert.equal(rows[0].title, "Audit Draft")
        if (kind === "group-photos") {
            assert.equal(rows[0].status, "draft")
            assert.deepEqual(rows[0].linkedPeople, ["Fixture Person"])
        }
    }
})

test("administrator can still publish through the original action", async () => {
    const { auth } = authorization(validSession)
    const changes = [],
        logs = []
    const db = {
        ...readDatabase(() => [{ title: "Fixture Draft" }]),
        update: () => ({
            set: (values) => ({
                where: async () => {
                    changes.push(values)
                },
            }),
        }),
    }
    const { entry } = isolatedEntry("src/app/admin/actions.ts", auth, {
        "@/db": { db },
        "@/lib/logAdminAction": { logAdminAction: async (...args) => logs.push(args) },
        "@/lib/flash": { flashParam: () => "?fixture=published" },
    })
    await assert.rejects(
        entry.toggleMaterialStatus(91, "draft"),
        /REDIRECT:\/admin\?fixture=published/,
    )
    assert.equal(changes[0].status, "published")
    assert.equal(logs[0][0], "publish")
})

test("login pages and public home render without requiring admin", async () => {
    const { auth } = authorization(null)
    for (const file of [
        "src/app/admin/login/page.tsx",
        "src/app/login/page.tsx",
        "src/app/page.tsx",
    ]) {
        const { entry, effects } = isolatedEntry(file, auth)
        assert.ok(await entry.default({ searchParams: Promise.resolve({}) }))
        assert.deepEqual(effects, [])
    }
})

test("shared admin layout leaves login accessible and does not read comments anonymously", async () => {
    const { auth } = authorization(null)
    const { entry, effects } = isolatedEntry("src/app/admin/layout.tsx", auth)
    assert.ok(await entry.default({ children: "Fixture Login" }))
    assert.deepEqual(effects, [])
})

test("public challenge API continues serving challenges without administrator access", async () => {
    const { auth } = authorization(null)
    const { entry, effects } = isolatedEntry("src/app/api/comments/challenge/route.ts", auth, {
        "@/app/comments/altcha": {
            createAltchaCommentChallenge: async () => ({ challenge: "fixture" }),
        },
    })
    const response = await entry.GET()
    assert.equal(response.status, 200)
    assert.equal((await response.json()).challenge, "fixture")
    assert.deepEqual(effects, [])
})

test("admin password change preserves current-password validation and hashing", async () => {
    const { auth } = authorization(validSession)
    const changes = [],
        compared = []
    const db = {
        ...readDatabase(() => [{ password: "fixture-old-hash" }]),
        update: () => ({ set: (values) => ({ where: async () => changes.push(values) }) }),
    }
    const { entry } = isolatedEntry("src/app/admin/settings/actions.ts", auth, {
        "@/db": { db },
        bcryptjs: {
            compare: async (value, hash) => {
                compared.push([value, hash])
                return value === "fixture-current"
            },
            hash: async (value, cost) => {
                assert.equal(cost, 12)
                return `fixture-hash:${value}`
            },
        },
        "@/lib/flash": { flashParam: (message) => `?message=${message}` },
    })
    const form = new FormData()
    form.set("current", "fixture-current")
    form.set("next", "fixture-new-password")
    form.set("confirm", "fixture-new-password")
    await assert.rejects(entry.updatePassword(form), /Пароль изменён/)
    assert.equal(changes[0].password, "fixture-hash:fixture-new-password")
    assert.deepEqual(compared[0], ["fixture-current", "fixture-old-hash"])
    form.set("current", "wrong-fixture-current")
    await assert.rejects(entry.updatePassword(form), /Неверный текущий пароль/)
    assert.equal(changes.length, 1)
})

test("comment moderation records the verified administrator ID", async () => {
    const { auth } = authorization(validSession)
    const changes = []
    const db = {
        update: () => ({
            set: (values) => ({
                where: () => ({
                    returning: async () => {
                        changes.push(values)
                        return []
                    },
                }),
            }),
        }),
    }
    const { entry } = isolatedEntry("src/app/admin/comments/actions.ts", auth, { "@/db": { db } })
    await entry.approveComment(91)
    await entry.hideComment(91)
    assert.equal(changes[0].moderatedBy, admin.id)
    assert.equal(changes[0].status, "approved")
    assert.equal(changes[1].status, "hidden")
})

test("layout never loads editorial counts for rejected accounts, but loads them for admin", async () => {
    for (const [session, user] of [
        [null, admin],
        [validSession, null],
        [validSession, { ...admin, role: "reader" }],
    ]) {
        const { auth } = authorization(session, user)
        const { entry, effects } = isolatedEntry("src/app/admin/layout.tsx", auth)
        assert.ok(await entry.default({ children: "Fixture Login" }))
        assert.deepEqual(effects, [])
    }
    const { auth } = authorization(validSession)
    let queries = 0
    const { entry } = isolatedEntry("src/app/admin/layout.tsx", auth, {
        "@/db": {
            db: readDatabase(() => {
                queries++
                return [{ total: 2 }]
            }),
        },
    })
    assert.ok(await entry.default({ children: "Fixture editor" }))
    assert.equal(queries, 1)
})

test("proxy keeps login public while protecting other administrative paths", async () => {
    const entry = loadServerModule("src/proxy.ts", {
        "next/server": {
            NextResponse: {
                next: () => new Response(null, { status: 200 }),
                redirect: (url) =>
                    new Response(null, { status: 307, headers: { location: String(url) } }),
            },
        },
        jose: {
            jwtVerify: async () => {
                throw new Error("invalid fixture session")
            },
        },
    })
    for (const pathname of ["/admin/login", "/admin/login/"]) {
        const result = await entry.proxy({
            nextUrl: { pathname },
            cookies: { get: () => undefined },
            url: `http://fixture.invalid${pathname}`,
        })
        assert.equal(result.status, 200)
    }
    for (const pathname of ["/admin/materials", "/admin/login-help"]) {
        const result = await entry.proxy({
            nextUrl: { pathname },
            cookies: { get: () => undefined },
            url: `http://fixture.invalid${pathname}`,
        })
        assert.equal(result.status, 307)
    }
})
