import { expect, test } from "bun:test"
import { Schema } from "effect"
import { CreateInput as CreateShell } from "../src/shell.js"
import { CreateInput as CreateWorktree } from "../src/worktree.js"

type JsonSchema = { $ref?: string; properties?: Record<string, JsonSchema>; description?: string }
type Document = { schema: JsonSchema; definitions: Record<string, JsonSchema> }

function property(document: Document, name: string) {
  const root = document.schema.$ref ? document.definitions[document.schema.$ref.split("/").at(-1)!]! : document.schema
  const value = root.properties?.[name]
  return value?.$ref ? document.definitions[value.$ref.split("/").at(-1)!]! : value
}

test("descriptions written around optional fields reach the JSON schema", () => {
  const shell = Schema.toJsonSchemaDocument(CreateShell) as unknown as Document
  const worktree = Schema.toJsonSchemaDocument(CreateWorktree) as unknown as Document

  expect(property(shell, "timeout")?.description).toBe("Timeout in milliseconds. Omit or pass 0 for no timeout.")
  expect(property(worktree, "directory")?.description).toContain("Parent directory for the new worktree")
  expect(property(shell, "cwd")?.description).toBeUndefined()
})
