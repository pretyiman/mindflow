# client/src/components/graph

## Popover cancel affordances

Two floating popovers exist for node creation: the toolbar's "Add Node" (`GraphCanvas.tsx`,
`.canvas-add-node-popover`) and a node's own "+" quick-add (`CustomNode.tsx`,
`.flow-quick-add-popover`). Both must support **Escape**, **click-away**, and an explicit **Cancel**
button - all three reset the input/category/error state without creating anything. If you add
another creation popover, copy this exact pattern - the one non-obvious part is that the
click-away listener **must use the capture phase** (see either file's comment on its
`mousedown` listener for why: React Flow's own pane/node handlers call `stopPropagation()` for
pan/drag-selection, which silently swallows a bubble-phase document listener before it ever fires).
