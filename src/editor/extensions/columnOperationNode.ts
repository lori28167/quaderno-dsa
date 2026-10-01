import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ColumnOperationView from "../../math/ColumnOperationView";
import type { OperationKind } from "../../math/arithmetic";
import { describeOperation } from "../../math/labels";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    columnOperation: {
      insertColumnOperation: (kind: OperationKind) => ReturnType;
    };
  }
}

function parseOperands(raw: string | null): string[] {
  try {
    const value: unknown = JSON.parse(raw ?? "");
    if (Array.isArray(value) && value.every((v) => typeof v === "string")) return value;
  } catch {
    // fall through to default
  }
  return ["", ""];
}

export const ColumnOperation = Node.create({
  name: "columnOperation",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      kind: {
        default: "addition",
        parseHTML: (el) => el.getAttribute("data-kind"),
        renderHTML: (attrs) => ({ "data-kind": attrs.kind }),
      },
      operands: {
        default: ["", ""],
        parseHTML: (el) => parseOperands(el.getAttribute("data-operands")),
        renderHTML: (attrs) => ({ "data-operands": JSON.stringify(attrs.operands) }),
      },
      showCarries: {
        default: true,
        parseHTML: (el) => el.getAttribute("data-show-carries") !== "false",
        renderHTML: (attrs) => ({ "data-show-carries": String(attrs.showCarries) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="column-operation"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "column-operation" })];
  },

  renderText({ node }) {
    return describeOperation(node.attrs.kind, node.attrs.operands);
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnOperationView);
  },

  addCommands() {
    return {
      insertColumnOperation:
        (kind) =>
        ({ commands }) =>
          commands.insertBlock({ type: this.name, attrs: { kind, operands: ["", ""] } }),
    };
  },
});
