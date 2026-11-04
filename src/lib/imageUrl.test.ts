import assert from "node:assert/strict"
import test from "node:test"
import { getImageUrl, isUploadKey } from "./imageUrl"

test("upload keys resolve to encoded local image routes", () => {
    assert.equal(
        getImageUrl("uploads/фото 1.jpg"),
        "/api/images/uploads/%D1%84%D0%BE%D1%82%D0%BE%201.jpg",
    )
    assert.equal(getImageUrl("uploads/a#b?.png"), "/api/images/uploads/a%23b%3F.png")
})

test("external, static and preview URLs remain unchanged", () => {
    for (const value of [
        "https://example.com/a.jpg",
        "http://example.com/a.jpg",
        "/logo.png",
        "blob:preview",
        "/api/images/uploads/a.jpg",
    ]) {
        assert.equal(getImageUrl(value), value)
        assert.equal(isUploadKey(value), false)
    }
})

test("storage key validation rejects traversal and ambiguous separators", () => {
    for (const value of [
        "uploads/../a",
        "uploads/./a",
        "uploads/",
        "uploads//a",
        "uploads/a\\b",
        "uploads/a\u0000b",
        "other/a",
    ]) {
        assert.equal(isUploadKey(value), false, value)
    }
})
