import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { useNotebook } from "../notebook/useNotebook";
import { ColumnOperation } from "./extensions/columnOperationNode";
import Toolbar from "./toolbar/Toolbar";
import "./Editor.css";

function Editor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ showOnlyCurrent: false, placeholder: "Scrivi qui…" }),
      ColumnOperation,
    ],
    content: "",
    autofocus: true,
  });
  const notebook = useNotebook(editor);

  return (
    <div className="editor-wrapper">
      <Toolbar editor={editor} notebook={notebook} />
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
}

export default Editor;
