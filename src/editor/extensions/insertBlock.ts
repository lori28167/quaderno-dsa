import { Extension, type JSONContent } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    insertBlock: {
      insertBlock: (block: JSONContent) => ReturnType;
    };
  }
}

// Inserting an atom block would leave it selected, so the next inserted block would
// replace it. An empty line after the block takes the cursor instead, ready for writing.
export const InsertBlock = Extension.create({
  name: "insertBlock",

  addCommands() {
    return {
      insertBlock:
        (block) =>
        ({ commands }) =>
          commands.insertContent([block, { type: "paragraph" }]),
    };
  },
});
