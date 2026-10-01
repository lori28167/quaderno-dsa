import type { ReactNode } from "react";

interface Props {
  title: string;
  onDelete: () => void;
  children?: ReactNode;
}

function BlockHeader({ title, onDelete, children }: Props) {
  return (
    <div className="graph-block__header">
      <span className="graph-block__title">{title}</span>
      {children}
      <button type="button" className="graph-block__delete" onClick={onDelete} aria-label={`Elimina ${title.toLowerCase()}`}>
        ✕
      </button>
    </div>
  );
}

export default BlockHeader;
