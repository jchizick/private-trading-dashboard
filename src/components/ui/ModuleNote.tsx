interface ModuleNoteProps {
  children: React.ReactNode;
}

export function ModuleNote({ children }: ModuleNoteProps) {
  return <p className="moduleNote">{children}</p>;
}
