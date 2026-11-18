const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")

// Compile the real entry point with explicit dependency substitutes. Never import
// the real DB/S3 modules or load environment files in these isolation tests.
function loadServerModule(filename, dependencies, fallback, environment = {}) {
    const source = fs.readFileSync(path.resolve(filename), "utf8")
    const compiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
            jsx: ts.JsxEmit.ReactJSX,
            esModuleInterop: true,
        },
    }).outputText
    const module = { exports: {} }
    const context = {
        module,
        exports: module.exports,
        require(id) {
            if (Object.hasOwn(dependencies, id)) return dependencies[id]
            if (fallback) return fallback(id, filename)
            throw new Error(`Unmocked dependency: ${id}`)
        },
        console,
        URL,
        URLSearchParams,
        Request,
        Response,
        FormData,
        File,
        Buffer,
        TextEncoder,
        Date,
        process: { env: { ...environment } },
    }
    vm.runInNewContext(compiled, context, { filename })
    return module.exports
}

module.exports = { loadServerModule }
