"use client";

import { useRef, useState, useTransition } from "react";
import { createFlashcardManual } from "@/app/actions/flashcard-actions";

export default function FlashcardForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = new FormData(formRef.current!);

    setError("");
    setSuccess(false);

    startTransition(async () => {
      try {
        await createFlashcardManual(data);
        formRef.current?.reset();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} style={styles.form}>
      <p style={styles.title}>Novo flashcard manual</p>

      <div style={styles.cardPreview}>
        <div style={styles.side}>
          <span style={styles.sideLabel}>Frente — inglês</span>
          <textarea
            name="front"
            placeholder="Ex: to procrastinate"
            required
            rows={2}
            style={styles.textarea}
          />
        </div>

        <div style={styles.divider} />

        <div style={styles.side}>
          <span style={styles.sideLabel}>Verso — português</span>
          <textarea
            name="back"
            placeholder="Ex: procrastinar, adiar"
            required
            rows={2}
            style={styles.textarea}
          />
        </div>
      </div>

      <button type="submit" disabled={isPending} style={styles.btn}>
        {isPending ? "Criando…" : "Criar flashcard"}
      </button>

      {success && <p style={styles.successMsg}>✓ Flashcard criado!</p>}
      {error && <p style={styles.errorMsg}>{error}</p>}
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: { maxWidth: 480 },
  title: {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--color-text-primary)",
    marginBottom: 12,
  },
  cardPreview: {
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  side: {
    padding: "1rem 1.25rem",
    background: "var(--color-background-primary)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  sideLabel: {
    fontSize: 11,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: ".05em",
    color: "var(--color-text-tertiary)",
  },
  textarea: {
    border: "none",
    outline: "none",
    background: "transparent",
    color: "var(--color-text-primary)",
    fontSize: 16,
    fontFamily: "inherit",
    resize: "none",
    width: "100%",
    lineHeight: 1.5,
  },
  divider: {
    height: "0.5px",
    background: "var(--color-border-tertiary)",
  },
  btn: {
    width: "100%",
    padding: "10px",
    borderRadius: 8,
    border: "0.5px solid var(--color-border-secondary)",
    background: "var(--color-text-primary)",
    color: "var(--color-background-primary)",
    fontWeight: 500,
    fontSize: 14,
    cursor: "pointer",
  },
  successMsg: {
    fontSize: 13,
    color: "var(--color-text-success)",
    marginTop: 8,
  },
  errorMsg: { fontSize: 13, color: "var(--color-text-danger)", marginTop: 8 },
};
