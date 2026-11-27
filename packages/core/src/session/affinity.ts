export * as SessionAffinity from "./affinity.js"

import { Effect } from "effect"
import type { SessionSchema } from "./schema.js"

type Ancestor = Pick<SessionSchema.Info, "id" | "parentID" | "fork">

// TODO: Should the `model.request` hook expose affinity so plugins stop deriving it from `ctx.session.get`?
/** The Session ID that groups model requests for provider cache routing: children share the parent's, forks the fork source's. */
export const get = (session: Ancestor) => session.parentID ?? session.fork?.sessionID ?? session.id

/**
 * The root of the parent/fork chain. A fork of a fork must reuse the original session's cache key; using the
 * intermediate fork writes the same prompt under a key nothing was sent with before.
 */
export const root = (session: Ancestor, resolve: (id: SessionSchema.ID) => Effect.Effect<Ancestor | undefined>) =>
  Effect.gen(function* () {
    let current = session
    const visited = new Set<string>([session.id])
    while (true) {
      const parentID = current.parentID ?? current.fork?.sessionID
      if (!parentID || visited.has(parentID)) return current.id
      const parent = yield* resolve(parentID)
      if (!parent) return parentID
      visited.add(parentID)
      current = parent
    }
  })
