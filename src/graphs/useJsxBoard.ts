import { useEffect, useRef, type DependencyList } from "react";
import JXG from "jsxgraph";
import "jsxgraph/distrib/jsxgraph.css";

JXG.Options.text.fontSize = 16;

export const GRAPH_COLORS = ["#1d4ed8", "#c2410c", "#15803d", "#7e22ce", "#be123c", "#0e7490"];

// [xMin, yMax, xMax, yMin], as JSXGraph expects.
export type BoundingBox = [number, number, number, number];

// The board is rebuilt whenever `deps` change (simple and cheap at this size), but the
// student's pan and zoom are kept as long as the requested area stays the same.
export function useJsxBoard(
  build: (board: JXG.Board) => void,
  { boundingbox, keepAspectRatio }: { boundingbox: BoundingBox; keepAspectRatio: boolean },
  deps: DependencyList,
) {
  const ref = useRef<HTMLDivElement>(null);
  const savedView = useRef<{ requested: string; view: BoundingBox } | null>(null);
  const requested = JSON.stringify(boundingbox);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const view = savedView.current?.requested === requested ? savedView.current.view : boundingbox;
    const board = JXG.JSXGraph.initBoard(el, {
      boundingbox: view,
      keepAspectRatio,
      axis: true,
      grid: true,
      showCopyright: false,
      showNavigation: true,
      pan: { enabled: true, needShift: false },
      zoom: { wheel: true, needShift: true },
    });
    build(board);
    return () => {
      savedView.current = { requested, view: board.getBoundingBox() as BoundingBox };
      JXG.JSXGraph.freeBoard(board);
    };
  }, [requested, keepAspectRatio, ...deps]);

  return ref;
}
