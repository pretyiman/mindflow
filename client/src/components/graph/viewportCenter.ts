// Lets the toolbar's "+ Add Node" place a new node at the point the user is
// currently looking at, instead of the array-index grid fallback in
// graphAdapter.ts (which silently lands off-screen once nodes have been
// dragged into a real layout - the node gets created but nobody sees it).
type CenterFn = () => { x: number; y: number };

let currentGetter: CenterFn | null = null;

export function registerViewportCenter(fn: CenterFn | null) {
  currentGetter = fn;
}

export function getCurrentViewportCenter(): { x: number; y: number } | null {
  return currentGetter ? currentGetter() : null;
}
