import { parseNote, type NoteColor, type NoteSegment } from "../../app/lib/note-format"

export const NOTE_COLOR_STYLES: Record<NoteColor, { label: string; text: string; swatch: string }> = {
  amarelo: { label: "Marca-texto", text: "bg-brand text-black rounded px-1 box-decoration-clone", swatch: "bg-brand" },
  verde: { label: "Verde", text: "text-note-green font-semibold", swatch: "bg-note-green" },
  azul: { label: "Azul", text: "text-note-blue font-semibold", swatch: "bg-note-blue" },
  rosa: { label: "Rosa", text: "text-note-pink font-semibold", swatch: "bg-note-pink" },
  vermelho: { label: "Vermelho", text: "text-note-red font-semibold", swatch: "bg-note-red" },
}

/** Mostra o texto de uma anotação com as cores aplicadas. Passe `segments` se já tiver o texto separado. */
export default function ColoredText({ text, segments }: { text?: string; segments?: NoteSegment[] }) {
  const parts = segments ?? parseNote(text ?? "")
  return (
    <>
      {parts.map((segment, i) =>
        segment.color ? (
          <span key={i} className={NOTE_COLOR_STYLES[segment.color].text}>
            {segment.text}
          </span>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </>
  )
}
