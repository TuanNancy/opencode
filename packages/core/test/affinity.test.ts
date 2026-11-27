import { expect, test } from "bun:test"
import { Session } from "@opencode/schema/session"
import { SessionMessage } from "@opencode/schema/session-message"
import { Effect } from "effect"
import { SessionAffinity } from "../src/session/affinity.js"

type Node = Parameters<typeof SessionAffinity.root>[0]

const id = (value: string) => Session.ID.make(value)
const plain = (value: string, parentID?: string): Node => ({
  id: id(value),
  ...(parentID ? { parentID: id(parentID) } : {}),
})
const fork = (value: string, sessionID: string): Node => ({
  id: id(value),
  fork: { sessionID: id(sessionID), boundary: { type: "before", messageID: SessionMessage.ID.make("msg_boundary") } },
})

const resolve = (nodes: Node[]) => (sessionID: Session.ID) =>
  Effect.succeed(nodes.find((node) => node.id === sessionID))

test("affinity uses the root of a fork chain, not the intermediate fork", async () => {
  const parent = plain("ses_parent")
  const middle = fork("ses_middle", "ses_parent")
  const child = fork("ses_child", "ses_middle")

  expect(SessionAffinity.get(child)).toBe(id("ses_middle"))
  expect(await Effect.runPromise(SessionAffinity.root(child, resolve([parent, middle, child])))).toBe(id("ses_parent"))
})

test("affinity walks parent links for nested subagents", async () => {
  const nodes = [
    plain("ses_root"),
    plain("ses_child", "ses_root"),
    plain("ses_grandchild", "ses_child"),
  ]

  expect(await Effect.runPromise(SessionAffinity.root(nodes[2]!, resolve(nodes)))).toBe(id("ses_root"))
})

test("affinity stops at a missing ancestor and at a cycle", async () => {
  const nodes = [plain("ses_child", "ses_missing")]
  expect(await Effect.runPromise(SessionAffinity.root(nodes[0]!, resolve(nodes)))).toBe(id("ses_missing"))

  const first = plain("ses_first", "ses_second")
  const second = plain("ses_second", "ses_first")
  expect(await Effect.runPromise(SessionAffinity.root(first, resolve([first, second])))).toBe(id("ses_second"))
})
