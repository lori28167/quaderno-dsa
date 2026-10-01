import { Node, mergeAttributes, type NodeViewProps } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import type { FunctionComponent } from "react";

interface GraphNodeConfig {
  name: string;
  attributes: Record<string, unknown>;
  view: FunctionComponent<NodeViewProps>;
  describe: (attrs: Record<string, unknown>) => string;
}

// Mouse and keyboard events on the drawing area and on form controls belong to the
// graph, not to the text editor (otherwise dragging a point would select text).
function stopEvent({ event }: { event: Event }): boolean {
  const target = event.target as HTMLElement | null;
  return Boolean(target?.closest?.("input, textarea, select, button, .graph-surface"));
}

// Block nodes whose attributes are plain JSON (lists of functions, points, data rows…).
export function createGraphNode({ name, attributes, view, describe }: GraphNodeConfig) {
  const dataType = name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  return Node.create({
    name,
    group: "block",
    atom: true,
    selectable: true,
    draggable: false,

    addAttributes() {
      return Object.fromEntries(
        Object.entries(attributes).map(([key, fallback]) => [
          key,
          {
            default: fallback,
            parseHTML: (el: HTMLElement) => {
              const raw = el.getAttribute(`data-${key}`);
              if (raw === null) return fallback;
              try {
                return JSON.parse(raw);
              } catch {
                return fallback;
              }
            },
            renderHTML: (attrs: Record<string, unknown>) => ({ [`data-${key}`]: JSON.stringify(attrs[key]) }),
          },
        ]),
      );
    },

    parseHTML() {
      return [{ tag: `div[data-type="${dataType}"]` }];
    },

    renderHTML({ HTMLAttributes }) {
      return ["div", mergeAttributes(HTMLAttributes, { "data-type": dataType })];
    },

    renderText({ node }) {
      return describe(node.attrs);
    },

    addNodeView() {
      return ReactNodeViewRenderer(view, { stopEvent });
    },
  });
}
