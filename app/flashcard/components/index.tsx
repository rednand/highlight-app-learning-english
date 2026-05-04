"use client";

import { fetchFlashcards, updateFlashcard } from "../actions";
import { useState, useEffect, useCallback } from "react";

type Flashcard = {
  id: string;
  front: string;
  back: string;
  ease_factor: number;
  interval_days: number;
  next_review_at: string;
  vocabulary?: {
    word: string;
    translation: string;
    audio_url?: string;
  };
};

type Grade = 0 | 1 | 2 | 3 | 4 | 5;

function sm2(card: Flashcard, grade: Grade): Partial<Flashcard> {
  let { ease_factor, interval_days } = card;
  ease_factor = Math.max(
    1.3,
    ease_factor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02),
  );
  if (grade < 3) {
    interval_days = 1;
  } else {
    interval_days =
      interval_days === 1 ? 6 : Math.round(interval_days * ease_factor);
  }
  const next_review_at = new Date();
  next_review_at.setDate(next_review_at.getDate() + interval_days);
  return {
    ease_factor: parseFloat(ease_factor.toFixed(2)),
    interval_days,
    next_review_at: next_review_at.toISOString(),
  };
}

const GRADES: { grade: Grade; label: string; sub: string; color: string }[] = [
  { grade: 0, label: "Blackout", sub: "Esqueceu tudo", color: "#E24B4A" },
  { grade: 1, label: "Muito difícil", sub: "Errou", color: "#EF9F27" },
  { grade: 2, label: "Difícil", sub: "Quase acertou", color: "#EF9F27" },
  { grade: 3, label: "Bom", sub: "Acertou com esforço", color: "#1D9E75" },
  { grade: 4, label: "Fácil", sub: "Acertou com hesitação", color: "#1D9E75" },
  { grade: 5, label: "Perfeito", sub: "Acertou de cara", color: "#0F6E56" },
];

function GradeButton({
  grade,
  label,
  sub,
  color,
  onClick,
}: (typeof GRADES)[0] & { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 0,
        padding: "10px 6px",
        borderRadius: 10,
        border: `1.5px solid ${color}22`,
        background: `${color}11`,
        cursor: "pointer",
        transition: "all .15s",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = `${color}22`;
        (e.currentTarget as HTMLButtonElement).style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = `${color}11`;
        (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}22`;
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color }}>{label}</span>
      <span style={{ fontSize: 10, color: `${color}99`, whiteSpace: "nowrap" }}>
        {sub}
      </span>
    </button>
  );
}

export default function FlashcardReview() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    fetchFlashcards().then(({ cards }) => {
      setCards(cards ?? []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        if (!flipped) handleFlip();
      }
      if (flipped) {
        const map: Record<string, Grade> = {
          Digit1: 0,
          Digit2: 1,
          Digit3: 2,
          Digit4: 3,
          Digit5: 4,
          Digit6: 5,
        };
        if (map[e.code] !== undefined) handleGrade(map[e.code]);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [flipped, index]);

  const handleFlip = useCallback(() => {
    setIsFlipping(true);
    setTimeout(() => {
      setFlipped(true);
      setIsFlipping(false);
    }, 150);
  }, []);

  const handleGrade = useCallback(
    async (grade: Grade) => {
      const card = cards[index];
      const update = sm2(card, grade);
      await updateFlashcard(card.id, update as { ease_factor: number; interval_days: number; next_review_at: string });
      setReviewed((r) => r + 1);
      if (index + 1 >= cards.length) {
        setDone(true);
      } else {
        setFlipped(false);
        setIndex((i) => i + 1);
      }
    },
    [cards, index],
  );

  const playAudio = (url: string) => new Audio(url).play();

  if (loading)
    return (
      <div style={st.container}>
        <div style={st.emptyState}>
          <div style={st.spinner} />
          <p style={st.emptyText}>Carregando flashcards…</p>
        </div>
      </div>
    );

  if (cards.length === 0)
    return (
      <div style={st.container}>
        <div style={st.emptyState}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <p style={st.emptyTitle}>Nada para revisar hoje!</p>
          <p style={st.emptyText}>
            Você está em dia com todos os flashcards.
            <br />
            Volte amanhã para a próxima sessão.
          </p>
        </div>
      </div>
    );

  if (done)
    return (
      <div style={st.container}>
        <div style={st.emptyState}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <p style={st.emptyTitle}>Sessão concluída!</p>
          <p style={st.emptyText}>
            Você revisou <strong>{reviewed}</strong> flashcard
            {reviewed !== 1 ? "s" : ""} hoje.
          </p>
          <button
            style={st.restartBtn}
            onClick={() => {
              setDone(false);
              setIndex(0);
              setFlipped(false);
              setReviewed(0);
            }}
          >
            Revisar novamente
          </button>
        </div>
      </div>
    );

  const card = cards[index];
  const progress = Math.round((index / cards.length) * 100);

  return (
    <div style={st.container}>
      <div style={st.header}>
        <span style={st.counter}>
          {index + 1} / {cards.length}
        </span>
        <div style={st.progressBar}>
          <div style={{ ...st.progressFill, width: `${progress}%` }} />
        </div>
        <span style={st.reviewedBadge}>{reviewed} revisados</span>
      </div>

      <div
        style={{
          ...st.card,
          opacity: isFlipping ? 0 : 1,
          transform: isFlipping ? "scale(0.97)" : "scale(1)",
          transition: "opacity .15s, transform .15s",
        }}
      >
        <div style={st.cardSide}>
          <span style={st.sideLabel}>inglês</span>
          <p style={st.cardWord}>{card.front}</p>
          {card.vocabulary?.audio_url && (
            <button
              style={st.audioBtn}
              onClick={() => playAudio(card.vocabulary!.audio_url!)}
              title="Ouvir pronúncia"
            >
              🔊
            </button>
          )}
        </div>

        {!flipped ? (
          <button style={st.flipBtn} onClick={handleFlip}>
            Ver tradução <kbd style={st.kbd}>espaço</kbd>
          </button>
        ) : (
          <>
            <div style={st.divider} />
            <div style={st.cardSide}>
              <span style={st.sideLabel}>português</span>
              <p style={{ ...st.cardWord, fontSize: 22 }}>{card.back}</p>
            </div>
            <div style={st.nextReviewHints}>
              {GRADES.map(({ grade, label, color }) => {
                const est = sm2(card, grade);
                return (
                  <span key={grade} style={{ ...st.hint, color }}>
                    {label}: +{est.interval_days}d
                  </span>
                );
              })}
            </div>
            <div style={st.gradeRow}>
              {GRADES.map((g) => (
                <GradeButton
                  key={g.grade}
                  {...g}
                  onClick={() => handleGrade(g.grade)}
                />
              ))}
            </div>
            <p style={st.kbdHint}>
              Atalhos: <kbd style={st.kbd}>1–6</kbd> para avaliar
            </p>
          </>
        )}
      </div>

      <div style={st.cardMeta}>
        <span>EF: {card.ease_factor.toFixed(2)}</span>
        <span>Intervalo atual: {card.interval_days}d</span>
        <span>
          Próxima revisão:{" "}
          {new Date(card.next_review_at).toLocaleDateString("pt-BR")}
        </span>
      </div>
    </div>
  );
}

const st: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 560,
    margin: "0 auto",
    padding: "2rem 1rem",
    fontFamily: "var(--font-sans, system-ui)",
  },
  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 },
  counter: {
    fontSize: 13,
    fontWeight: 500,
    color: "var(--color-text-secondary, #888)",
    minWidth: 40,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    background: "var(--color-border-tertiary, #e5e5e5)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    background: "var(--color-text-primary, #111)",
    transition: "width .4s ease",
  },
  reviewedBadge: { fontSize: 12, color: "var(--color-text-tertiary, #aaa)" },
  card: {
    background: "var(--color-background-primary, #fff)",
    border: "0.5px solid var(--color-border-tertiary, #e5e5e5)",
    borderRadius: 16,
    padding: "2rem 1.5rem 1.5rem",
    marginBottom: 12,
  },
  cardSide: { textAlign: "center" as const, position: "relative" as const },
  sideLabel: {
    fontSize: 11,
    fontWeight: 500,
    textTransform: "uppercase" as const,
    letterSpacing: ".06em",
    color: "var(--color-text-tertiary, #bbb)",
    display: "block",
    marginBottom: 8,
  },
  cardWord: {
    fontSize: 28,
    fontWeight: 500,
    color: "var(--color-text-primary, #111)",
    margin: "0 0 12px",
    lineHeight: 1.3,
  },
  audioBtn: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 8,
    marginBottom: 8,
  },
  flipBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: "1.5rem auto 0",
    padding: "10px 24px",
    border: "0.5px solid var(--color-border-secondary, #d0d0d0)",
    borderRadius: 8,
    background: "transparent",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--color-text-primary, #111)",
  },
  divider: {
    height: "0.5px",
    background: "var(--color-border-tertiary, #e5e5e5)",
    margin: "1.25rem 0",
  },
  nextReviewHints: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap" as const,
    justifyContent: "center",
    marginBottom: 16,
  },
  hint: { fontSize: 11, fontWeight: 500 },
  gradeRow: { display: "flex", gap: 6, marginBottom: 12 },
  kbdHint: {
    textAlign: "center" as const,
    fontSize: 11,
    color: "var(--color-text-tertiary, #bbb)",
    margin: 0,
  },
  kbd: {
    display: "inline-block",
    padding: "1px 5px",
    border: "0.5px solid var(--color-border-secondary, #d0d0d0)",
    borderRadius: 4,
    fontSize: 10,
    fontFamily: "var(--font-mono, monospace)",
    background: "var(--color-background-secondary, #f5f5f5)",
  },
  cardMeta: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap" as const,
    fontSize: 11,
    color: "var(--color-text-tertiary, #bbb)",
    justifyContent: "center",
  },
  emptyState: { textAlign: "center" as const, padding: "4rem 1rem" },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 500,
    color: "var(--color-text-primary, #111)",
    margin: "0 0 8px",
  },
  emptyText: {
    fontSize: 14,
    color: "var(--color-text-secondary, #666)",
    lineHeight: 1.6,
    margin: 0,
  },
  restartBtn: {
    marginTop: 20,
    padding: "10px 24px",
    border: "0.5px solid var(--color-border-secondary, #d0d0d0)",
    borderRadius: 8,
    background: "transparent",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--color-text-primary, #111)",
  },
  spinner: {
    width: 24,
    height: 24,
    border: "2px solid var(--color-border-tertiary, #e5e5e5)",
    borderTopColor: "var(--color-text-primary, #111)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 12px",
  },
};
