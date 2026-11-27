import { expect, test } from "bun:test"
import { NodeFileSystem } from "@effect/platform-node"
import { Effect, Logger } from "effect"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Logging } from "../src/observability/logging.js"

test("the file logger keeps a shared object on sibling fields", async () => {
  const dir = await mkdtemp(join(tmpdir(), "opencode-logging-"))
  const target = join(dir, "test.log")
  const shared = { value: 42 }
  const cycle: Record<string, unknown> = { label: "root" }
  cycle.self = cycle

  try {
    const layer = Logger.layer([Logging.fileLogger(target, "shared-test")], { mergeWithExisting: false })
    await Effect.gen(function* () {
      yield* Effect.logInfo({ first: shared, second: shared }).pipe(Effect.provide(layer))
      yield* Effect.logInfo({ cycle }).pipe(Effect.provide(layer))
    }).pipe(Effect.scoped, Effect.provide(NodeFileSystem.layer), Effect.runPromise)

    const contents = await Bun.file(target).text()
    expect(contents).toContain("first.value=42")
    expect(contents).toContain("second.value=42")
    expect(contents).not.toContain("second=[Circular]")
    expect(contents).toContain("cycle.self=[Circular]")
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
