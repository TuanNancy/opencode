import type { EditorSelection } from "../../context/editor"

type Range = EditorSelection["ranges"][number]

export function hasEditorRangeSelection(selection: Range) {
  return (
    selection.selection.start.line !== selection.selection.end.line ||
    selection.selection.start.character !== selection.selection.end.character
  )
}

/**
 * Editor line numbers in the badge and the model reminder are 1-based. WebSocket selections arrive with 0-based
 * positions; Zed selections are already 1-based.
 */
export function getEditorRangeLabel(selection: Range, source: EditorSelection["source"]) {
  if (!hasEditorRangeSelection(selection)) return
  const line = (value: number) => (source === "websocket" ? value + 1 : value)
  const start = line(selection.selection.start.line)
  const end = line(selection.selection.end.line)
  return start === end ? `#${start}` : `#${start}-${end}`
}
