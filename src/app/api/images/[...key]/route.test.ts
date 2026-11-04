import assert from "node:assert/strict"
import test from "node:test"
import { GET } from "./route"

const request = new Request("http://localhost/api/images/uploads/a.jpg")
const resolve = (...key: string[]) => GET(request, { params: Promise.resolve({ key }) })

test("image redirect reads runtime storage base and does not cache it", async () => {
    const previous = process.env.S3_PUBLIC_URL
    try {
        process.env.S3_PUBLIC_URL = "https://first.example/bucket/"
        const first = await resolve("uploads", "фото 1.jpg")
        assert.equal(first.status, 307)
        assert.equal(
            first.headers.get("location"),
            "https://first.example/bucket/uploads/%D1%84%D0%BE%D1%82%D0%BE%201.jpg",
        )
        assert.equal(first.headers.get("cache-control"), "no-store")
        process.env.S3_PUBLIC_URL = "https://second.example/new-bucket"
        assert.equal(
            (await resolve("uploads", "a.jpg")).headers.get("location"),
            "https://second.example/new-bucket/uploads/a.jpg",
        )
        delete process.env.S3_PUBLIC_URL
        assert.equal((await resolve("uploads", "a.jpg")).status, 503)
        process.env.S3_PUBLIC_URL = "file:///tmp"
        assert.equal((await resolve("uploads", "a.jpg")).status, 503)
    } finally {
        if (previous === undefined) delete process.env.S3_PUBLIC_URL
        else process.env.S3_PUBLIC_URL = previous
    }
})

test("image route rejects non-upload and unsafe decoded path segments", async () => {
    for (const segments of [
        ["other", "a"],
        ["uploads", "..", "a"],
        ["uploads", "a/b"],
        ["uploads", "a\\b"],
        ["uploads", ""],
    ]) {
        assert.equal((await resolve(...segments)).status, 400)
    }
})
