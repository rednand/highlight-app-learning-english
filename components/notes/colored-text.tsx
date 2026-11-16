import { parseNote, type NoteColor } from "../../app/lib/note-format"

export const NOTE_COLOR_STYLES: Record<NoteColor, { label: string; text: string; swatch: string }> = {
  amarelo: { label: "Marca-texto", text: "bg-brand text-black rounded px-1 box-decoration-clone", swatch: "bg-brand" },
  verde: { label: "Verde", text: "text-green-400 font-semibold", swatch: "bg-green-400" },
  azul: { label: "Azul", text: "text-sky-300 font-semibold", swatch: "bg-sky-300" },
  rosa: { label: "Rosa", text: "text-pink-300 font-semibold", swatch: "bg-pink-300" },
  vermelho: { label: "Vermelho", text: "text-red-400 font-semibold", swatch: "bg-red-400" },
}

export default function ColoredText({ text }: { text: string }) {
  return (
    <>
      {parseNote(text).map((segment, i) =>
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
