import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import "./Editor.css";

function Editor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    autofocus: true,
  });

  return (
    <div className="editor-wrapper">
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
}

export default Editor;
