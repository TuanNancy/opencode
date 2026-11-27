import { expect, test } from "bun:test"
import { getEditorRangeLabel, hasEditorRangeSelection } from "../../src/component/prompt/editor-selection-label"

const range = (startLine: number, endLine: number, startChar = 0, endChar = 0) => ({
  text: "selected",
  selection: {
    start: { line: startLine, character: startChar },
    end: { line: endLine, character: endChar },
  },
})

test("WebSocket editor selections are shown as 1-based lines", () => {
  expect(getEditorRangeLabel(range(12, 15), "websocket")).toBe("#13-16")
  expect(getEditorRangeLabel(range(12, 12, 2, 6), "websocket")).toBe("#13")
})

test("Zed and unknown sources keep their 1-based lines", () => {
  expect(getEditorRangeLabel(range(12, 15), "zed")).toBe("#12-15")
  expect(getEditorRangeLabel(range(12, 15), undefined)).toBe("#12-15")
})

test("a cursor without a selection range has no label", () => {
  expect(hasEditorRangeSelection(range(12, 12))).toBe(false)
  expect(getEditorRangeLabel(range(12, 12), "websocket")).toBeUndefined()
})
