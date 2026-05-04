"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "./utils/supabase/client";
import styles from "./Home.module.css";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading)
    return (
      <div
        className={styles.container}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#facc15" }}>Carregando...</div>
      </div>
    );

  const userName = user?.user_metadata?.full_name || user?.email;

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.logoArea}>
          <span className={styles.badge}>EN</span>
          <span className={styles.logoText}>Lumen.</span>
        </div>

        <div className={styles.navLinks}>
          <button className={styles.navLink} onClick={() => router.push("/")}>
            Home
          </button>
          <button
            className={styles.navLink}
            onClick={() => router.push("/lessons")}
          >
            Dashboard
          </button>
          <button
            className={styles.navLink}
            onClick={() => router.push("/flashcard")}
          >
            Flashcards
          </button>
        </div>

        {user ? (
          <div className={styles.userSection}>
            <span className={styles.userName}>{userName}</span>
            <button onClick={handleLogout} className={styles.signOutBtn}>
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className={styles.signOutBtn}
          >
            Sign in
          </button>
        )}
      </nav>

      <main className={styles.hero}>
        <p className={styles.subHeader}>ENGLISH • STUDY • REPEAT</p>

        <h1 className={styles.title}>
          Learn English in a <br />
          <span className={styles.highlight}>quiet, focused</span> space.
        </h1>

        <p className={styles.description}>
          {user
            ? `Welcome back, ${userName}. `
            : "A quiet place for loud progress. "}
          Take notes, record your voice, and drill flashcards with native
          pronunciation.
        </p>

        {user && (
          <div className={styles.actions}>
            <button
              className={styles.primaryBtn}
              onClick={() => router.push("/lessons")}
            >
              Start studying <span>→</span>
            </button>
          </div>
        )}

        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>📖</div>
            <h3 className={styles.cardTitle}>Dashboard</h3>
            <p className={styles.cardText}>
              Structured chapters you write or import. Track your own
              curriculum.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>🎤</div>
            <h3 className={styles.cardTitle}>Voice notes</h3>
            <p className={styles.cardText}>
              Type a thought, record yourself saying it. Build pronunciation
              muscle.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>📚</div>
            <h3 className={styles.cardTitle}>Flashcards</h3>
            <p className={styles.cardText}>
              Spaced repetition with one-tap text-to-speech for every term.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
